import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  refreshTokenLifetimeMs
} from '../config/auth.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AppError } from '../utils/AppError.js';
import { createRandomToken, hashToken } from '../utils/crypto.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      version: user.authVersion,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

export function setSessionCookies(res, { accessToken, refreshToken, csrfToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions({ maxAge: 15 * 60 * 1000 }));
  res.cookie(
    REFRESH_COOKIE,
    refreshToken,
    cookieOptions({ maxAge: refreshTokenLifetimeMs() })
  );
  res.cookie(
    CSRF_COOKIE,
    csrfToken,
    cookieOptions({ httpOnly: false, maxAge: refreshTokenLifetimeMs() })
  );
}

export function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  res.clearCookie(CSRF_COOKIE, cookieOptions({ httpOnly: false }));
}

export async function createSession(user, req, res, family = new mongoose.Types.ObjectId().toString()) {
  const accessToken = signAccessToken(user);
  const refreshToken = createRandomToken();
  const csrfToken = createRandomToken(24);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt: new Date(Date.now() + refreshTokenLifetimeMs()),
    createdByIp: req.ip,
    userAgent: req.get('user-agent') || ''
  });

  setSessionCookies(res, { accessToken, refreshToken, csrfToken });
  return { csrfToken };
}

export async function rotateSession(rawToken, user, req, res) {
  const tokenHash = hashToken(rawToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken || storedToken.expiresAt <= new Date()) {
    throw new AppError('Invalid refresh session', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (storedToken.revokedAt) {
    await RefreshToken.updateMany(
      { family: storedToken.family, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw new AppError('Refresh token reuse detected', 401, 'REFRESH_TOKEN_REUSE');
  }

  const nextRefreshToken = createRandomToken();
  const nextHash = hashToken(nextRefreshToken);
  const csrfToken = createRandomToken(24);

  storedToken.revokedAt = new Date();
  storedToken.replacedByHash = nextHash;
  await storedToken.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: nextHash,
    family: storedToken.family,
    expiresAt: new Date(Date.now() + refreshTokenLifetimeMs()),
    createdByIp: req.ip,
    userAgent: req.get('user-agent') || ''
  });

  setSessionCookies(res, {
    accessToken: signAccessToken(user),
    refreshToken: nextRefreshToken,
    csrfToken
  });

  return { csrfToken };
}

export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function revokeAllUserSessions(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}
