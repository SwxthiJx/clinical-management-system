import {
  createApprovedDoctor,
  getDoctors,
  getUsers,
  setUserActiveStatus
} from '../services/userManagementService.js';
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
  res.status(201).json({ doctor: doctor.toSafeObject() });
});

export const updateActiveStatus = asyncHandler(async (req, res) => {
  const user = await setUserActiveStatus({
    actor: req.user,
    userId: req.params.id,
    isActive: req.validated.body.isActive
  });
  res.json({ user });
});
