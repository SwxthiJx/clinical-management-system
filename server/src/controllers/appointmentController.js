import mongoose from 'mongoose';
import { hasPermission } from '../config/permissions.js';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { getSlotEnd, hasAppointmentConflict, isInsideAvailability } from '../services/slotService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function appointmentQueryForUser(user) {
  if (hasPermission(user, 'appointment:read-any')) return {};
  if (hasPermission(user, 'appointment:read-assigned')) return { doctor: user._id };
  return { patient: user._id };
}

function canAccessAppointment(user, appointment) {
  if (hasPermission(user, 'appointment:update-any') || hasPermission(user, 'appointment:cancel-any')) {
    return true;
  }

  if (
    user.role === 'doctor' &&
    appointment.doctor.toString() === user._id.toString()
  ) {
    return true;
  }

  return (
    user.role === 'patient' &&
    appointment.patient.toString() === user._id.toString()
  );
}

export const listAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find(appointmentQueryForUser(req.user))
    .populate('patient', 'name email phone')
    .populate('doctor', 'name email specialty')
    .sort({ startTime: 1 })
    .lean();

  res.json({ appointments });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, startTime, reason, patientId: requestedPatientId } = req.validated.body;
  const patientId = hasPermission(req.user, 'appointment:create-any')
    ? requestedPatientId
    : req.user._id;

  if (!patientId) {
    throw new AppError('Patient is required', 400, 'PATIENT_REQUIRED');
  }

  const [doctor, patient] = await Promise.all([
    User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
      approvedAt: { $ne: null }
    }),
    User.findOne({ _id: patientId, role: 'patient', isActive: true }).select('_id')
  ]);

  if (!doctor) {
    throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }
  if (!patient) {
    throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  const start = new Date(startTime);
  if (start <= new Date()) {
    throw new AppError(
      'Appointment must be scheduled in the future',
      400,
      'APPOINTMENT_NOT_IN_FUTURE'
    );
  }

  const end = getSlotEnd(start);
  if (!isInsideAvailability(doctor, start, end)) {
    throw new AppError(
      'Requested time is outside doctor availability',
      409,
      'OUTSIDE_AVAILABILITY'
    );
  }

  if (await hasAppointmentConflict({ doctorId, startTime: start, endTime: end })) {
    throw new AppError(
      'This doctor is already booked for the selected slot',
      409,
      'APPOINTMENT_CONFLICT'
    );
  }

  try {
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      startTime: start,
      endTime: end,
      reason
    });

    const populated = await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name email specialty' }
    ]);

    res.status(201).json({ appointment: populated });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error.code !== 11000) {
      throw error;
    }

    throw new AppError(
      'This doctor is already booked for the selected slot',
      409,
      'APPOINTMENT_CONFLICT'
    );
  }
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.validated.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  if (!canAccessAppointment(req.user, appointment) || req.user.role === 'patient') {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }

  appointment.status = status;
  appointment.cancelledBy = status === 'cancelled' ? req.user.role : null;
  await appointment.save();

  const populated = await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name email specialty' }
  ]);

  res.json({ appointment: populated });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  if (!canAccessAppointment(req.user, appointment)) {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }

  appointment.status = 'cancelled';
  appointment.cancelledBy = req.user.role;
  await appointment.save();

  res.json({ appointment });
});
