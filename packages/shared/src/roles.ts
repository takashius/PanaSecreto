/**
 * Roles globales del sistema (fuente única para backend, panel web y app).
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  USER: 'USER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Orden de prioridad: el primero es el de mayor jerarquía */
export const ALL_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER];

export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/** Roles que pueden entrar al panel web (USER es exclusivo de la app móvil) */
export const WEB_ACCESS_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ORGANIZER];

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador del sistema',
  ADMIN: 'Administrador general',
  ORGANIZER: 'Organizador de grupos y eventos',
  USER: 'Usuario participante',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ALL_ROLES as string[]).includes(value);
}

/** Roles que un actor puede asignar: SUPER_ADMIN todos; ADMIN todos menos SUPER_ADMIN */
export function assignableRolesFor(actorRole: string | string[] | null | undefined): UserRole[] {
  const roles = Array.isArray(actorRole) ? actorRole : actorRole ? [actorRole] : [];
  if (roles.includes(ROLES.SUPER_ADMIN)) return [...ALL_ROLES];
  if (roles.includes(ROLES.ADMIN)) return [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER];
  return [];
}
