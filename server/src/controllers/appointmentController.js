import {
  bookAppointment,
  cancelAppointmentForUser,
  changeAppointmentStatus,
  listAppointmentsForUser,
  listAvailableSlots
} from '../services/appointmentManagementService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { sendAppointmentNotificationSafely } from '../services/appointmentNotificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAppointments = asyncHandler(async (req, res) => {
  res.json({ appointments: await listAppointmentsForUser(req.user) });
});

export const listSlots = asyncHandler(async (req, res) => {
  res.json(await listAvailableSlots(req.validated.query));
});

export const createAppointment = asyncHandler(async (req, res) => {
  const result = await bookAppointment({ user: req.user, payload: req.validated.body });
  if (result.created) {
    await recordAuditEvent({
      req,
      action: 'appointment.booked',
      entityType: 'appointment',
      entityId: result.appointment._id,
      metadata: {
        doctorId: req.validated.body.doctorId,
        patientId: result.appointment.patient?._id || result.appointment.patient,
        startTime: result.appointment.startTime
      }
    });
    await sendAppointmentNotificationSafely({
      appointment: result.appointment,
      type: 'confirmation'
    });
  }
  res.status(result.created ? 201 : 200).json({
    appointment: result.appointment,
    ...(result.idempotent ? { idempotent: true } : {})
  });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await changeAppointmentStatus({
    user: req.user,
    appointmentId: req.params.id,
    status: req.validated.body.status
  });
  await recordAuditEvent({
    req,
    action: 'appointment.status_changed',
    entityType: 'appointment',
    entityId: appointment._id,
    metadata: { status: req.validated.body.status }
  });
  await sendAppointmentNotificationSafely({
    appointment,
    type: req.validated.body.status === 'completed' ? 'completion' : 'cancellation'
  });
  res.json({ appointment });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointmentForUser({
    user: req.user,
    appointmentId: req.params.id
  });
  await recordAuditEvent({
    req,
    action: 'appointment.cancelled',
    entityType: 'appointment',
    entityId: appointment._id,
    metadata: { cancelledBy: req.user.role }
  });
  await sendAppointmentNotificationSafely({ appointment, type: 'cancellation' });
  res.json({ appointment });
});
