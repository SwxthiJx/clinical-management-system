import jwt from 'jsonwebtoken';
import { ACCESS_COOKIE } from '../config/auth.js';
import { hasPermission } from '../config/permissions.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, bearerToken] = authHeader.split(' ');
    const token = req.cookies?.[ACCESS_COOKIE] || (scheme === 'Bearer' ? bearerToken : null);

    if (!token) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      return next(new AppError('Invalid access token', 401, 'INVALID_ACCESS_TOKEN'));
    }

    const user = await User.findById(decoded.sub).select('+authVersion');

    if (!user || !user.isActive || user.authVersion !== decoded.version) {
      return next(new AppError('Invalid user session', 401, 'INVALID_USER_SESSION'));
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired access token', 401, 'INVALID_ACCESS_TOKEN'));
  }
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!hasPermission(req.user, permission)) {
      return next(new AppError('Permission denied', 403, 'PERMISSION_DENIED'));
    }

    next();
  };
}

export function requireAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!permissions.some((permission) => hasPermission(req.user, permission))) {
      return next(new AppError('Permission denied', 403, 'PERMISSION_DENIED'));
    }

    next();
  };
}
