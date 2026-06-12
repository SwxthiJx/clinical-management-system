import {
  addDoctorAvailability,
  addScheduleException,
  getDoctorAvailability,
  getScheduleExceptions,
  removeDoctorAvailability,
  removeScheduleException,
  resolveDoctorId
} from '../services/availabilityManagementService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.validated.query.doctorId || req.user._id;
  res.json({ doctor: await getDoctorAvailability(doctorId) });
});

export const addAvailability = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req.user, req.validated.body.doctorId);
  const { dayOfWeek, startTime, endTime } = req.validated.body;
  const availability = await addDoctorAvailability({
    doctorId,
    window: { dayOfWeek, startTime, endTime }
  });
  res.status(201).json({ availability });
});

export const deleteAvailability = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req.user, req.validated.query.doctorId);
  const availability = await removeDoctorAvailability({ doctorId, windowId: req.params.id });
  res.json({ availability });
});

export const listExceptions = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req.user, req.validated.query.doctorId);
  res.json({ exceptions: await getScheduleExceptions(doctorId) });
});

export const addException = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req.user, req.validated.body.doctorId);
  const exception = await addScheduleException({
    doctorId,
    date: req.validated.body.date,
    reason: req.validated.body.reason,
    createdBy: req.user._id
  });
  res.status(201).json({ exception });
});

export const deleteException = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req.user, req.validated.query.doctorId);
  await removeScheduleException({ doctorId, exceptionId: req.params.id });
  res.status(204).send();
});
