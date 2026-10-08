export const ROLES = {
  USER: 'USER',
  ORGANIZER: 'ORGANIZER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ORGANIZER,
  ROLES.USER,
];

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador del sistema',
  ADMIN: 'Administrador general',
  ORGANIZER: 'Organizador de grupos y eventos',
  USER: 'Usuario participante',
};

/** El rol USER es exclusivo de la app móvil: no entra al panel. */
export const WEB_ACCESS_ROLES: UserRole[] = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.ORGANIZER,
];

export const ADMIN_ROLES: UserRole[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

const ROLE_PRIORITY: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ORGANIZER,
  ROLES.USER,
];

export const normalizeRole = (role?: string | string[] | null): UserRole | null => {
  if (!role) return null;
  if (Array.isArray(role)) {
    const roles = role.map((item) => normalizeRole(item)).filter(Boolean) as UserRole[];
    return ROLE_PRIORITY.find((candidate) => roles.includes(candidate)) ?? null;
  }
  const upper = role.toUpperCase() as UserRole;
  if (Object.values(ROLES).includes(upper)) return upper;
  return null;
};

export const canAccessWeb = (role?: string | string[] | null): boolean => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return WEB_ACCESS_ROLES.includes(normalized);
};

export const isAdminRole = (role?: string | string[] | null): boolean => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return ADMIN_ROLES.includes(normalized);
};

export const isSuperAdminRole = (role?: string | string[] | null): boolean =>
  normalizeRole(role) === ROLES.SUPER_ADMIN;

export const canManageUsers = (role?: string | string[] | null): boolean => isAdminRole(role);
