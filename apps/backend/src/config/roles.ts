export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  USER: 'USER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ORGANIZER,
  ROLES.USER,
];

export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const WEB_ACCESS_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ORGANIZER,
];

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador del sistema',
  ADMIN: 'Administrador general',
  ORGANIZER: 'Organizador de grupos y eventos',
  USER: 'Usuario participante',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ALL_ROLES.includes(value as UserRole);
}

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

export function assignableRolesFor(actorRole: string | string[]): UserRole[] {
  if (isSuperAdminRole(actorRole)) {
    return [...ALL_ROLES];
  }
  if (isAdminRole(actorRole)) {
    return [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER];
  }
  return [];
}
