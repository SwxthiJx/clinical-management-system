import crypto from 'crypto';

export function createRandomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createRequestId() {
  return crypto.randomUUID();
}
