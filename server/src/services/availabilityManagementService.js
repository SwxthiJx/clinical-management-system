import { User } from '../models/User.js';
import {
  deleteDoctorException,
  listDoctorExceptions,
  upsertDoctorException
} from '../repositories/scheduleRepository.js';
import { findActiveDoctorById } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';

export function resolveDoctorId(user, requestedDoctorId) {
  return user.role === 'doctor' ? user._id : requestedDoctorId;
}

export async function getDoctorAvailability(doctorId) {
  const doctor = await findActiveDoctorById(doctorId, 'name specialty availability').lean();
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  return doctor;
}

export async function addDoctorAvailability({ doctorId, window }) {
  if (!doctorId) throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  const doctor = await findActiveDoctorById(doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  doctor.availability.push(window);
  await doctor.save();
  return doctor.availability;
}

export async function removeDoctorAvailability({ doctorId, windowId }) {
  if (!doctorId) throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  const window = doctor.availability.id(windowId);
  if (!window) throw new AppError('Availability window not found', 404, 'AVAILABILITY_NOT_FOUND');
  window.deleteOne();
  await doctor.save();
  return doctor.availability;
}

export function getScheduleExceptions(doctorId) {
  if (!doctorId) throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  return listDoctorExceptions(doctorId);
}

export async function addScheduleException({ doctorId, date, reason, createdBy }) {
  if (!doctorId) throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  if (!(await findActiveDoctorById(doctorId).select('_id'))) {
    throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }
  return upsertDoctorException({ doctorId, date, reason, createdBy });
}

export async function removeScheduleException({ doctorId, exceptionId }) {
  if (!doctorId) throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  const exception = await deleteDoctorException({ id: exceptionId, doctorId });
  if (!exception) throw new AppError('Schedule exception not found', 404, 'EXCEPTION_NOT_FOUND');
}
