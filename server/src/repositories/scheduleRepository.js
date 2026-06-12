import { ScheduleException } from '../models/ScheduleException.js';

export function listDoctorExceptions(doctorId) {
  return ScheduleException.find({ doctor: doctorId }).sort({ date: 1 }).lean();
}

export function upsertDoctorException({ doctorId, date, reason, createdBy }) {
  return ScheduleException.findOneAndUpdate(
    { doctor: doctorId, date },
    { doctor: doctorId, date, reason, createdBy },
    { new: true, upsert: true, runValidators: true }
  );
}

export function deleteDoctorException({ id, doctorId }) {
  return ScheduleException.findOneAndDelete({ _id: id, doctor: doctorId });
}
