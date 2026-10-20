import { z } from 'zod';

/**
 * Estados del flujo de un grupo de amigo secreto
 * - WAITING: Esperando participantes para unirse
 * - LOCKED: Sorteo realizado, asignaciones bloqueadas
 * - REVEALED: Identidades de los amigos secretos reveladas
 * - COMPLETED: Evento de intercambio finalizado
 */
export const GroupStatusEnum = {
  WAITING: 'WAITING',
  LOCKED: 'LOCKED',
  REVEALED: 'REVEALED',
  COMPLETED: 'COMPLETED',
} as const;

export const GroupStatusSchema = z.enum([
  GroupStatusEnum.WAITING,
  GroupStatusEnum.LOCKED,
  GroupStatusEnum.REVEALED,
  GroupStatusEnum.COMPLETED,
]);

export type GroupStatus = z.infer<typeof GroupStatusSchema>;

/**
 * Roles de los miembros dentro de un grupo
 * - CREATOR: Administrador y creador del intercambio
 * - PARTICIPANT: Miembro participante
 */
export const MemberRoleEnum = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
} as const;

export const MemberRoleSchema = z.enum([
  MemberRoleEnum.CREATOR,
  MemberRoleEnum.PARTICIPANT,
]);

export type MemberRole = z.infer<typeof MemberRoleSchema>;

/**
 * Monedas soportadas para el presupuesto del intercambio
 */
export const CurrencyEnum = {
  USD: 'USD',
  VES: 'VES',
} as const;

export const CurrencySchema = z.enum([CurrencyEnum.USD, CurrencyEnum.VES]);

export type Currency = z.infer<typeof CurrencySchema>;

/** Límites de participantes por grupo */
export const GROUP_MIN_PARTICIPANTS = 3;
export const GROUP_MAX_PARTICIPANTS = 50;
