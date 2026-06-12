export const permissionsByRole = {
  patient: new Set([
    'appointment:create-own',
    'appointment:read-own',
    'appointment:cancel-own',
    'appointment:reschedule-own',
    'doctor:read'
  ]),
  doctor: new Set([
    'appointment:read-assigned',
    'appointment:update-assigned',
    'appointment:reschedule-assigned',
    'availability:manage-own',
    'doctor:read'
  ]),
  admin: new Set([
    'appointment:create-any',
    'appointment:read-any',
    'appointment:update-any',
    'appointment:cancel-any',
    'appointment:reschedule-any',
    'availability:manage-any',
    'doctor:read',
    'doctor:create',
    'user:read-any',
    'user:manage-any',
    'system:read'
  ])
};

export function hasPermission(user, permission) {
  return Boolean(user && permissionsByRole[user.role]?.has(permission));
}
