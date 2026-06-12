import crypto from 'crypto';
import { CSRF_COOKIE } from '../config/auth.js';
import { AppError } from '../utils/AppError.js';

export function requireCsrf(req, _res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  const cookieBuffer = Buffer.from(cookieToken || '');
  const headerBuffer = Buffer.from(headerToken || '');

  if (
    !cookieToken ||
    !headerToken ||
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return next(new AppError('Invalid CSRF token', 403, 'INVALID_CSRF_TOKEN'));
  }

  next();
}
