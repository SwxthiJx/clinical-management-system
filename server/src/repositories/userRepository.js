import { User } from '../models/User.js';

export function findActiveDoctorById(id, select = '') {
  const query = User.findOne({
    _id: id,
    role: 'doctor',
    isActive: true,
    approvedAt: { $ne: null }
  });
  return select ? query.select(select) : query;
}

export function findActivePatientById(id) {
  return User.findOne({ _id: id, role: 'patient', isActive: true }).select('_id');
}

export function findPatientById(id) {
  return User.findOne({ _id: id, role: 'patient', isActive: true })
    .select('name email phone')
    .lean();
}

export function listActiveDoctors() {
  return User.find({ role: 'doctor', isActive: true, approvedAt: { $ne: null } })
    .select('name username email specialty education experienceYears languages clinicalInterests bio phone availability')
    .sort({ name: 1 })
    .lean();
}

export function listAllUsers() {
  return User.find()
    .select('name username email role specialty education experienceYears languages clinicalInterests bio phone isActive emailVerifiedAt approvedAt createdAt')
    .sort({ createdAt: -1 })
    .lean();
}
