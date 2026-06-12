import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

const blockedKeys = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'csrfToken',
  'cookie',
  'authorization',
  'reason',
  'subjective',
  'objective',
  'assessment',
  'plan',
  'prescriptions',
  'followUpInstructions',
  'privateNotes'
]);

function sanitize(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitize);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !blockedKeys.has(key))
      .map(([key, item]) => [key, sanitize(item)])
  );
}

export async function recordAuditEvent({
  req,
  action,
  entityType,
  entityId,
  metadata = {},
  actor
}) {
  try {
    const auditActor = actor || req?.user;
    await AuditLog.create({
      actor: auditActor?._id || null,
      actorRole: auditActor?.role || 'system',
      action,
      entityType,
      entityId: entityId?.toString() || '',
      metadata: sanitize(metadata),
      requestId: req?.requestId || '',
      ip: req?.ip || '',
      userAgent: req?.get?.('user-agent') || ''
    });
  } catch (error) {
    logger.error('Failed to persist audit event', {
      action,
      entityType,
      requestId: req?.requestId,
      error
    });
  }
}

export function listAuditEvents({ limit = 50, action, actorRole }) {
  const query = {};
  if (action) query.action = action;
  if (actorRole) query.actorRole = actorRole;

  return AuditLog.find(query)
    .populate('actor', 'name email username role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
