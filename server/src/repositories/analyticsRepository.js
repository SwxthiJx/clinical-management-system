import { Appointment } from '../models/Appointment.js';
import { ScheduleException } from '../models/ScheduleException.js';
import { User } from '../models/User.js';

export function findAnalyticsAppointments(start, end) {
  return Appointment.find({ startTime: { $gte: start, $lte: end } })
    .select('patient doctor startTime status')
    .populate({ path: 'doctor', select: 'name specialty' })
    .lean();
}

export function findAnalyticsDoctors() {
  return User.find({ role: 'doctor', isActive: true, approvedAt: { $ne: null } })
    .select('name specialty availability')
    .sort({ name: 1 })
    .lean();
}

export function countActivePatients() {
  return User.countDocuments({ role: 'patient', isActive: true });
}

export function findScheduleExceptions(startDate, endDate) {
  return ScheduleException.find({ date: { $gte: startDate, $lte: endDate } })
    .select('doctor date')
    .lean();
}
