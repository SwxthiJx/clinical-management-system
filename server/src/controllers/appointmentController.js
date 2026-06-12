import {
  bookAppointment,
  cancelAppointmentForUser,
  changeAppointmentStatus,
  listAppointmentsForUser,
  listAvailableSlots
} from '../services/appointmentManagementService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAppointments = asyncHandler(async (req, res) => {
  res.json({ appointments: await listAppointmentsForUser(req.user) });
});

export const listSlots = asyncHandler(async (req, res) => {
  res.json(await listAvailableSlots(req.validated.query));
});

export const createAppointment = asyncHandler(async (req, res) => {
  const result = await bookAppointment({ user: req.user, payload: req.validated.body });
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
  res.json({ appointment });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointmentForUser({
    user: req.user,
    appointmentId: req.params.id
  });
  res.json({ appointment });
});
