import {
  ROLES,
  ALL_ROLES,
  ADMIN_ROLES,
  WEB_ACCESS_ROLES,
  ROLE_DESCRIPTIONS,
  isUserRole,
  assignableRolesFor,
  type UserRole,
} from '@panasecreto/shared';

// Constantes compartidas (fuente única en packages/shared)
export { ROLES, ALL_ROLES, ADMIN_ROLES, WEB_ACCESS_ROLES, ROLE_DESCRIPTIONS, isUserRole, assignableRolesFor };
export type { UserRole };

function toRoles(role: string | string[] | undefined): string[] {
  return Array.isArray(role) ? role : role ? [role] : [];
}

export function isAdminRole(role: string | string[] | undefined): boolean {
  return toRoles(role).some((item) => ADMIN_ROLES.includes(item as UserRole));
}

export function isSuperAdminRole(role: string | string[] | undefined): boolean {
  return toRoles(role).includes(ROLES.SUPER_ADMIN);
}

export function canAccessWeb(role: string | string[] | undefined): boolean {
  return toRoles(role).some((item) => WEB_ACCESS_ROLES.includes(item as UserRole));
}

/**
 * Determina si un actor puede gestionar (editar, desactivar, resetear clave) a un usuario objetivo.
 * - SUPER_ADMIN puede gestionar a cualquiera.
 * - ADMIN puede gestionar a cualquiera que NO sea SUPER_ADMIN.
 * - Otros roles no gestionan usuarios.
 */
export function canManageTarget(
  actorRole: string | string[] | undefined,
  targetRole: string | string[] | undefined
): boolean {
  if (isSuperAdminRole(actorRole)) return true;
  if (!isAdminRole(actorRole)) return false;
  return !isSuperAdminRole(targetRole);
}
