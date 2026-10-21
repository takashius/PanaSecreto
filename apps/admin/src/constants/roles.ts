import {
  ROLES,
  ALL_ROLES,
  ADMIN_ROLES,
  WEB_ACCESS_ROLES,
  ROLE_DESCRIPTIONS,
  assignableRolesFor as sharedAssignableRolesFor,
  type UserRole,
} from '@panasecreto/shared';

// Constantes compartidas con el backend (fuente única en packages/shared)
export { ROLES, ALL_ROLES, ADMIN_ROLES, WEB_ACCESS_ROLES, ROLE_DESCRIPTIONS };
export type { UserRole };

/** Normaliza el rol (string o arreglo) al de mayor jerarquía */
export const normalizeRole = (role?: string | string[] | null): UserRole | null => {
  if (!role) return null;
  if (Array.isArray(role)) {
    const roles = role.map((item) => normalizeRole(item)).filter(Boolean) as UserRole[];
    return ALL_ROLES.find((candidate) => roles.includes(candidate)) ?? null;
  }
  const upper = role.toUpperCase() as UserRole;
  return ALL_ROLES.includes(upper) ? upper : null;
};

export const canAccessWeb = (role?: string | string[] | null): boolean => {
  const normalized = normalizeRole(role);
  return normalized ? WEB_ACCESS_ROLES.includes(normalized) : false;
};

export const isAdminRole = (role?: string | string[] | null): boolean => {
  const normalized = normalizeRole(role);
  return normalized ? ADMIN_ROLES.includes(normalized) : false;
};

export const isSuperAdminRole = (role?: string | string[] | null): boolean =>
  normalizeRole(role) === ROLES.SUPER_ADMIN;

export const canManageUsers = (role?: string | string[] | null): boolean => isAdminRole(role);

/** Roles que el actor puede asignar (misma regla que el backend) */
export const assignableRolesFor = (role?: string | string[] | null): UserRole[] => sharedAssignableRolesFor(role);
