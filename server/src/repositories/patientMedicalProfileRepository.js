import { PatientMedicalProfile } from '../models/PatientMedicalProfile.js';

export function findPatientMedicalProfile(patientId) {
  return PatientMedicalProfile.findOne({ patient: patientId });
}

export function upsertPatientMedicalProfile({ patientId, updatedBy, profile }) {
  return PatientMedicalProfile.findOneAndUpdate(
    { patient: patientId },
    {
      $set: {
        ...profile,
        updatedBy
      },
      $setOnInsert: { patient: patientId }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}
