import {
  createApprovedDoctor,
  getDoctors,
  getUsers,
  setUserActiveStatus
} from '../services/userManagementService.js';
import {
  getPatientMedicalProfile,
  updateOwnPatientMedicalProfile
} from '../services/patientMedicalProfileService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDoctors = asyncHandler(async (_req, res) => {
  res.json({ doctors: await getDoctors() });
});

export const listUsers = asyncHandler(async (_req, res) => {
  res.json({ users: await getUsers() });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await createApprovedDoctor({
    payload: req.validated.body,
    approvedBy: req.user._id
  });
  await recordAuditEvent({
    req,
    action: 'doctor.created',
    entityType: 'user',
    entityId: doctor._id,
    metadata: { role: 'doctor', specialty: doctor.specialty }
  });
  res.status(201).json({ doctor: doctor.toSafeObject() });
});

export const updateActiveStatus = asyncHandler(async (req, res) => {
  const user = await setUserActiveStatus({
    actor: req.user,
    userId: req.params.id,
    isActive: req.validated.body.isActive
  });
  await recordAuditEvent({
    req,
    action: req.validated.body.isActive ? 'user.activated' : 'user.deactivated',
    entityType: 'user',
    entityId: user._id,
    metadata: { targetRole: user.role }
  });
  res.json({ user });
});

export const getOwnMedicalProfile = asyncHandler(async (req, res) => {
  res.json(
    await getPatientMedicalProfile({
      user: req.user,
      patientId: req.user._id
    })
  );
});

export const getMedicalProfile = asyncHandler(async (req, res) => {
  res.json(
    await getPatientMedicalProfile({
      user: req.user,
      patientId: req.params.id
    })
  );
});

export const updateOwnMedicalProfile = asyncHandler(async (req, res) => {
  const profile = await updateOwnPatientMedicalProfile({
    user: req.user,
    payload: req.validated.body
  });
  await recordAuditEvent({
    req,
    action: 'medical_profile.updated',
    entityType: 'patient_medical_profile',
    entityId: profile._id,
    metadata: { patientId: req.user._id }
  });
  res.json({ profile });
});
