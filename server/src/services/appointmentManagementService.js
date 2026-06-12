import mongoose from 'mongoose';
import { hasPermission } from '../config/permissions.js';
import {
  createAppointment as persistAppointment,
  findAppointmentById,
  findAppointments,
  findIdempotentAppointment,
  populateAppointment
} from '../repositories/appointmentRepository.js';
import { findActiveDoctorById, findActivePatientById } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import {
  assertStatusTransition,
  generateAvailableSlots,
  getSlotEnd,
  hasAppointmentConflict,
  isDateBlocked,
  isInsideAvailability
} from './slotService.js';

function queryForUser(user) {
  if (hasPermission(user, 'appointment:read-any')) return {};
  if (hasPermission(user, 'appointment:read-assigned')) return { doctor: user._id };
  return { patient: user._id };
}

function canAccess(user, appointment) {
  if (hasPermission(user, 'appointment:update-any') || hasPermission(user, 'appointment:cancel-any')) {
    return true;
  }
  if (user.role === 'doctor') return appointment.doctor.toString() === user._id.toString();
  return appointment.patient.toString() === user._id.toString();
}

export function listAppointmentsForUser(user) {
  return findAppointments(queryForUser(user));
}

export async function listAvailableSlots({ doctorId, date }) {
  const doctor = await findActiveDoctorById(doctorId, 'name specialty availability').lean();
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  return { doctor, date, slots: await generateAvailableSlots({ doctor, date }) };
}

export async function bookAppointment({ user, payload }) {
  const patientId = hasPermission(user, 'appointment:create-any') ? payload.patientId : user._id;
  if (!patientId) throw new AppError('Patient is required', 400, 'PATIENT_REQUIRED');

  if (payload.idempotencyKey) {
    const existing = await findIdempotentAppointment(patientId, payload.idempotencyKey);
    if (existing) return { appointment: existing, idempotent: true, created: false };
  }

  const [doctor, patient] = await Promise.all([
    findActiveDoctorById(payload.doctorId),
    findActivePatientById(patientId)
  ]);
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  if (!patient) throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');

  const start = new Date(payload.startTime);
  if (start <= new Date()) {
    throw new AppError('Appointment must be scheduled in the future', 400, 'APPOINTMENT_NOT_IN_FUTURE');
  }

  const end = getSlotEnd(start);
  if (await isDateBlocked(payload.doctorId, start)) {
    throw new AppError('Doctor is unavailable on this date', 409, 'SCHEDULE_EXCEPTION');
  }
  if (!isInsideAvailability(doctor, start, end)) {
    throw new AppError('Requested time is outside doctor availability', 409, 'OUTSIDE_AVAILABILITY');
  }
  if (await hasAppointmentConflict({ doctorId: payload.doctorId, startTime: start, endTime: end })) {
    throw new AppError('This doctor is already booked for the selected slot', 409, 'APPOINTMENT_CONFLICT');
  }

  try {
    const appointment = await persistAppointment({
      patient: patientId,
      doctor: payload.doctorId,
      startTime: start,
      endTime: end,
      reason: payload.reason,
      idempotencyKey: payload.idempotencyKey
    });
    return { appointment: await populateAppointment(appointment), idempotent: false, created: true };
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error.code !== 11000) throw error;
    throw new AppError('This doctor is already booked for the selected slot', 409, 'APPOINTMENT_CONFLICT');
  }
}

export async function changeAppointmentStatus({ user, appointmentId, status }) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  if (!canAccess(user, appointment) || user.role === 'patient') {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }
  if (!assertStatusTransition(appointment.status, status)) {
    throw new AppError(
      `Cannot change appointment from ${appointment.status} to ${status}`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }
  appointment.status = status;
  appointment.cancelledBy = status === 'cancelled' ? user.role : null;
  await appointment.save();
  return populateAppointment(appointment);
}

export async function cancelAppointmentForUser({ user, appointmentId }) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  if (!canAccess(user, appointment)) throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  if (!assertStatusTransition(appointment.status, 'cancelled')) {
    throw new AppError(
      `Cannot cancel appointment with status ${appointment.status}`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }
  appointment.status = 'cancelled';
  appointment.cancelledBy = user.role;
  await appointment.save();
  return populateAppointment(appointment);
}

export async function rescheduleAppointmentForUser({ user, appointmentId, startTime }) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  if (!canAccess(user, appointment)) throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  if (appointment.status !== 'booked') {
    throw new AppError(
      `Cannot reschedule appointment with status ${appointment.status}`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const start = new Date(startTime);
  if (start <= new Date()) {
    throw new AppError('Appointment must be scheduled in the future', 400, 'APPOINTMENT_NOT_IN_FUTURE');
  }
  if (start.getTime() === appointment.startTime.getTime()) {
    throw new AppError('Choose a different appointment time', 400, 'UNCHANGED_APPOINTMENT_TIME');
  }

  const doctor = await findActiveDoctorById(appointment.doctor);
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');

  const end = getSlotEnd(start);
  if (await isDateBlocked(appointment.doctor, start)) {
    throw new AppError('Doctor is unavailable on this date', 409, 'SCHEDULE_EXCEPTION');
  }
  if (!isInsideAvailability(doctor, start, end)) {
    throw new AppError('Requested time is outside doctor availability', 409, 'OUTSIDE_AVAILABILITY');
  }
  if (await hasAppointmentConflict({
    doctorId: appointment.doctor,
    startTime: start,
    endTime: end,
    excludeAppointmentId: appointment._id
  })) {
    throw new AppError('This doctor is already booked for the selected slot', 409, 'APPOINTMENT_CONFLICT');
  }

  const previousStartTime = appointment.startTime;
  appointment.startTime = start;
  appointment.endTime = end;
  appointment.rescheduleCount += 1;
  appointment.lastRescheduledAt = new Date();
  appointment.lastRescheduledBy = user.role;
  appointment.notifications.reminderSentAt = null;
  appointment.notifications.reminderClaimedAt = null;
  appointment.notifications.rescheduleSentAt = null;

  try {
    await appointment.save();
  } catch (error) {
    if (error.code !== 11000) throw error;
    throw new AppError('This doctor is already booked for the selected slot', 409, 'APPOINTMENT_CONFLICT');
  }

  return {
    appointment: await populateAppointment(appointment),
    previousStartTime
  };
}
