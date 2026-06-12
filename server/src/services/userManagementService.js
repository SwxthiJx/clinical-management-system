import { User } from '../models/User.js';
import { listActiveDoctors, listAllUsers } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import { revokeAllUserSessions } from './authService.js';

export function getDoctors() {
  return listActiveDoctors();
}

export function getUsers() {
  return listAllUsers();
}

export async function createApprovedDoctor({ payload, approvedBy }) {
  const normalizedUsername = payload.username.toLowerCase();
  const existing = await User.exists({
    $or: [{ email: payload.email.toLowerCase() }, { username: normalizedUsername }]
  });
  if (existing) {
    throw new AppError('Email or username is already registered', 409, 'ACCOUNT_ALREADY_EXISTS');
  }

  return User.create({
    ...payload,
    username: normalizedUsername,
    role: 'doctor',
    emailVerifiedAt: new Date(),
    approvedAt: new Date(),
    approvedBy
  });
}

export async function setUserActiveStatus({ actor, userId, isActive }) {
  if (userId === actor._id.toString() && !isActive) {
    throw new AppError('You cannot deactivate your own account', 400, 'CANNOT_DEACTIVATE_SELF');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  ).select('name username email role specialty phone isActive emailVerifiedAt approvedAt createdAt');

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  if (!user.isActive) await revokeAllUserSessions(user._id);
  return user;
}
