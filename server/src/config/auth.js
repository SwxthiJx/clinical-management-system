export const ACCESS_COOKIE = 'clinic_access';
export const REFRESH_COOKIE = 'clinic_refresh';
export const CSRF_COOKIE = 'clinic_csrf';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function cookieOptions({ httpOnly = true, maxAge } = {}) {
  return {
    httpOnly,
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction(),
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction() ? 'none' : 'lax'),
    path: '/',
    ...(maxAge ? { maxAge } : {})
  };
}

export function refreshTokenLifetimeMs() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 7);
  return days * 24 * 60 * 60 * 1000;
}
