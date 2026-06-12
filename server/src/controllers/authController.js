import bcrypt from 'bcryptjs';
import { REFRESH_COOKIE } from '../config/auth.js';
import { AuthToken } from '../models/AuthToken.js';
import { User } from '../models/User.js';
import {
  clearSessionCookies,
  createSession,
  revokeAllUserSessions,
  revokeRefreshToken,
  rotateSession
} from '../services/authService.js';
import { recordAuditEvent } from '../services/auditService.js';
import {
  isMailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail
} from '../services/mailService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createRandomToken, hashToken } from '../utils/crypto.js';

const DUMMY_PASSWORD_HASH = '$2a$12$7sQ8OhP3uWJ9Y4nm1QmL6e6mXq2gC5F1i80T3vkNQpP1f89B7bQkK';

function safeUser(user) {
  return user.toSafeObject ? user.toSafeObject() : user;
}

async function createPurposeToken(userId, type, lifetimeMs) {
  await AuthToken.deleteMany({ user: userId, type, usedAt: null });
  const token = createRandomToken();
  await AuthToken.create({
    user: userId,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + lifetimeMs)
  });
  return token;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.validated.body;

  const existing = await User.exists({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_REGISTERED');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'patient',
    approvedAt: new Date()
  });

  const verificationToken = await createPurposeToken(
    user._id,
    'email_verification',
    24 * 60 * 60 * 1000
  );
  await sendVerificationEmail(user, verificationToken);
  await recordAuditEvent({
    req,
    actor: user,
    action: 'account.registered',
    entityType: 'user',
    entityId: user._id,
    metadata: { role: user.role }
  });

  res.status(201).json({
    message: 'Account created. Check your email to verify your account.',
    ...(!isMailConfigured() && process.env.NODE_ENV !== 'production'
      ? {
          developmentVerificationUrl: `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/login?verifyToken=${encodeURIComponent(verificationToken)}`
        }
      : {})
  });
});

export const login = asyncHandler(async (req, res) => {
  const { login, password } = req.validated.body;
  const normalized = login.toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }]
  }).select('+password +authVersion');

  const passwordMatches = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches || !user.isActive) {
    throw new AppError('Invalid login or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.emailVerifiedAt) {
    throw new AppError('Verify your email before signing in', 403, 'EMAIL_NOT_VERIFIED');
  }

  if (user.role === 'doctor' && !user.approvedAt) {
    throw new AppError('Doctor account is awaiting approval', 403, 'DOCTOR_NOT_APPROVED');
  }

  const { csrfToken } = await createSession(user, req, res);
  await recordAuditEvent({
    req,
    actor: user,
    action: 'authentication.login',
    entityType: 'session',
    entityId: user._id,
    metadata: { role: user.role }
  });
  res.json({ user: safeUser(user), csrfToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE];
  if (!rawToken) {
    throw new AppError('Refresh session required', 401, 'REFRESH_SESSION_REQUIRED');
  }

  const { RefreshToken } = await import('../models/RefreshToken.js');
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!stored) {
    clearSessionCookies(res);
    throw new AppError('Invalid refresh session', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(stored.user).select('+authVersion');
  if (!user || !user.isActive) {
    clearSessionCookies(res);
    throw new AppError('Invalid user session', 401, 'INVALID_USER_SESSION');
  }

  const { csrfToken } = await rotateSession(rawToken, user, req, res);
  res.json({ user: safeUser(user), csrfToken });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
  clearSessionCookies(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: safeUser(req.user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.validated.body;
  const stored = await AuthToken.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      type: 'email_verification',
      usedAt: null,
      expiresAt: { $gt: new Date() }
    },
    { usedAt: new Date() },
    { new: true }
  );

  if (!stored) {
    throw new AppError('Verification link is invalid or expired', 400, 'INVALID_VERIFICATION_TOKEN');
  }

  await User.updateOne({ _id: stored.user }, { emailVerifiedAt: new Date() });
  await recordAuditEvent({
    req,
    action: 'account.email_verified',
    entityType: 'user',
    entityId: stored.user
  });

  res.json({ message: 'Email verified. You can now sign in.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  let developmentVerificationUrl;

  if (user && !user.emailVerifiedAt) {
    const token = await createPurposeToken(user._id, 'email_verification', 24 * 60 * 60 * 1000);
    await sendVerificationEmail(user, token);
    if (!isMailConfigured() && process.env.NODE_ENV !== 'production') {
      developmentVerificationUrl = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/login?verifyToken=${encodeURIComponent(token)}`;
    }
  }

  res.json({
    message: 'If the account exists and is unverified, a new email has been sent.',
    ...(developmentVerificationUrl ? { developmentVerificationUrl } : {})
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  if (user) {
    const token = await createPurposeToken(user._id, 'password_reset', 30 * 60 * 1000);
    await sendPasswordResetEmail(user, token);
  }

  res.json({ message: 'If the account exists, a password reset email has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated.body;
  const stored = await AuthToken.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      type: 'password_reset',
      usedAt: null,
      expiresAt: { $gt: new Date() }
    },
    { usedAt: new Date() },
    { new: true }
  );

  if (!stored) {
    throw new AppError('Password reset link is invalid or expired', 400, 'INVALID_RESET_TOKEN');
  }

  const user = await User.findById(stored.user).select('+password +authVersion');
  if (!user) {
    throw new AppError('Account not found', 404, 'USER_NOT_FOUND');
  }

  user.password = password;
  user.authVersion += 1;
  await user.save();
  await revokeAllUserSessions(user._id);
  await recordAuditEvent({
    req,
    actor: user,
    action: 'account.password_reset',
    entityType: 'user',
    entityId: user._id
  });

  clearSessionCookies(res);

  res.json({ message: 'Password reset successfully. Sign in with your new password.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  const user = await User.findById(req.user._id).select('+password +authVersion');

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  user.password = newPassword;
  user.authVersion += 1;
  await user.save();
  await revokeAllUserSessions(user._id);
  await recordAuditEvent({
    req,
    actor: user,
    action: 'account.password_changed',
    entityType: 'user',
    entityId: user._id
  });
  clearSessionCookies(res);

  res.json({ message: 'Password changed. Sign in again on your devices.' });
});
