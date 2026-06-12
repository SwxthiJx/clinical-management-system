import { User } from '../models/User.js';
import { revokeAllUserSessions } from '../services/authService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await User.find({
    role: 'doctor',
    isActive: true,
    approvedAt: { $ne: null }
  })
    .select('name username email specialty phone availability')
    .sort({ name: 1 })
    .lean();
  res.json({ doctors });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find()
    .select('name username email role specialty phone isActive emailVerifiedAt approvedAt createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ users });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, username, email, password, specialty, phone } = req.validated.body;
  const normalizedUsername = username.toLowerCase();

  const existing = await User.exists({
    $or: [{ email: email.toLowerCase() }, { username: normalizedUsername }]
  });
  if (existing) {
    throw new AppError('Email or username is already registered', 409, 'ACCOUNT_ALREADY_EXISTS');
  }

  const doctor = await User.create({
    name,
    username: normalizedUsername,
    email,
    password,
    specialty,
    phone,
    role: 'doctor',
    emailVerifiedAt: new Date(),
    approvedAt: new Date(),
    approvedBy: req.user._id
  });

  res.status(201).json({ doctor: doctor.toSafeObject() });
});

export const updateActiveStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString() && !req.validated.body.isActive) {
    throw new AppError('You cannot deactivate your own account', 400, 'CANNOT_DEACTIVATE_SELF');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.validated.body.isActive },
    { new: true, runValidators: true }
  ).select('name username email role specialty phone isActive emailVerifiedAt approvedAt createdAt');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    await revokeAllUserSessions(user._id);
  }

  res.json({ user });
});
