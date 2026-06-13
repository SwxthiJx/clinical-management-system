import { hasPermission } from '../config/permissions.js';
import { hasDoctorPatientRelationship } from '../repositories/appointmentRepository.js';
import {
  findPatientMedicalProfile,
  upsertPatientMedicalProfile
} from '../repositories/patientMedicalProfileRepository.js';
import { findPatientById } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';

function matches(left, right) {
  return left?.toString() === right?.toString();
}

async function authorizeRead({ user, patientId }) {
  if (hasPermission(user, 'medical-profile:read-any')) return;
  if (hasPermission(user, 'medical-profile:read-own') && matches(user._id, patientId)) return;
  if (
    hasPermission(user, 'medical-profile:read-assigned') &&
    (await hasDoctorPatientRelationship({ doctorId: user._id, patientId }))
  ) {
    return;
  }
  throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
}

export function presentPatientMedicalProfile(profile) {
  if (!profile) return null;
  const value = profile.toObject ? profile.toObject() : { ...profile };
  return {
    _id: value._id,
    age: value.age,
    bloodGroup: value.bloodGroup,
    allergies: value.allergies,
    conditions: value.conditions,
    medications: value.medications,
    emergencyContact: value.emergencyContact,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

export async function getPatientMedicalProfile({ user, patientId }) {
  await authorizeRead({ user, patientId });
  const patient = await findPatientById(patientId);
  if (!patient) throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');

  const profile = await findPatientMedicalProfile(patientId).lean();
  return {
    patient,
    profile: presentPatientMedicalProfile(profile)
  };
}

export async function updateOwnPatientMedicalProfile({ user, payload }) {
  if (user.role !== 'patient') {
    throw new AppError('Permission denied', 403, 'PERMISSION_DENIED');
  }

  const profile = await upsertPatientMedicalProfile({
    patientId: user._id,
    updatedBy: user._id,
    profile: payload
  });
  return presentPatientMedicalProfile(profile);
}
