import mongoose from 'mongoose';
import { hasPermission } from '../config/permissions.js';
import { findAppointmentById } from '../repositories/appointmentRepository.js';
import {
  createConsultationNote,
  findConsultationNoteByAppointment
} from '../repositories/consultationNoteRepository.js';
import { AppError } from '../utils/AppError.js';

function matches(left, right) {
  return left?.toString() === right?.toString();
}

function canReadAppointment(user, appointment) {
  if (hasPermission(user, 'consultation-note:read-any')) return true;
  if (
    hasPermission(user, 'consultation-note:read-assigned') &&
    matches(appointment.doctor, user._id)
  ) {
    return true;
  }
  return (
    hasPermission(user, 'consultation-note:read-own') &&
    matches(appointment.patient, user._id)
  );
}

export function presentConsultationNote(note, role) {
  if (!note) return null;
  const presented = note.toObject ? note.toObject() : { ...note };
  if (role === 'patient') {
    delete presented.privateNotes;
    delete presented.createdBy;
    delete presented.updatedBy;
  }
  return presented;
}

export async function getConsultationNoteForUser({ user, appointmentId }) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  if (!canReadAppointment(user, appointment)) {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }

  const note = await findConsultationNoteByAppointment(appointmentId);
  if (user.role === 'patient' && note?.status !== 'finalized') return null;
  return presentConsultationNote(note, user.role);
}

export async function saveConsultationNoteForDoctor({ user, appointmentId, payload }) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  if (!matches(appointment.doctor, user._id)) {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }
  if (appointment.status === 'cancelled') {
    throw new AppError(
      'Consultation notes cannot be added to a cancelled appointment',
      409,
      'CANCELLED_APPOINTMENT'
    );
  }

  let note = await findConsultationNoteByAppointment(appointmentId);
  if (note?.status === 'finalized' && payload.status === 'draft') {
    throw new AppError(
      'A finalized consultation note cannot be returned to draft',
      409,
      'FINALIZED_NOTE'
    );
  }

  const content = {
    subjective: payload.subjective,
    objective: payload.objective,
    assessment: payload.assessment,
    plan: payload.plan,
    prescriptions: payload.prescriptions,
    followUpInstructions: payload.followUpInstructions,
    followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
    privateNotes: payload.privateNotes,
    status: payload.status,
    updatedBy: user._id
  };

  try {
    if (!note) {
      note = await createConsultationNote({
        ...content,
        appointment: appointment._id,
        patient: appointment.patient,
        doctor: appointment.doctor,
        createdBy: user._id,
        finalizedAt: payload.status === 'finalized' ? new Date() : null
      });
    } else {
      Object.assign(note, content);
      note.revision += 1;
      if (payload.status === 'finalized' && !note.finalizedAt) note.finalizedAt = new Date();
      await note.save();
    }
  } catch (error) {
    if (!(error instanceof mongoose.Error.ValidationError) && error.code === 11000) {
      throw new AppError(
        'The consultation note was updated elsewhere. Reload and try again.',
        409,
        'CONSULTATION_NOTE_CONFLICT'
      );
    }
    throw error;
  }

  return presentConsultationNote(note, user.role);
}
