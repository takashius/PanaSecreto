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

/**
 * Género para sugerir alias: masculino, femenino o neutro (también "prefiero no decir").
 * Solo se usa para no proponer alias que no correspondan.
 */
export const GenderEnum = {
  M: 'M',
  F: 'F',
  N: 'N',
} as const;

export const GenderSchema = z.enum([GenderEnum.M, GenderEnum.F, GenderEnum.N]);

export type Gender = z.infer<typeof GenderSchema>;

/** Categorías de un deseo (la app muestra un ícono por categoría cuando no hay foto) */
export const WishCategoryEnum = {
  ROPA: 'ropa',
  TECNOLOGIA: 'tecnologia',
  HOGAR: 'hogar',
  DULCES: 'dulces',
  LIBROS: 'libros',
  OTRO: 'otro',
} as const;

export const WishCategorySchema = z.enum([
  WishCategoryEnum.ROPA,
  WishCategoryEnum.TECNOLOGIA,
  WishCategoryEnum.HOGAR,
  WishCategoryEnum.DULCES,
  WishCategoryEnum.LIBROS,
  WishCategoryEnum.OTRO,
]);

export type WishCategory = z.infer<typeof WishCategorySchema>;

/** Tipos de notificación dentro de la app */
export const NotificationKindEnum = {
  /** Mi amigo secreto comentó en uno de mis deseos */
  COMMENT: 'comment',
  /** El dueño del deseo respondió en un deseo de mi pana */
  REPLY: 'reply',
  /** Pista nueva en el chat del grupo */
  CHAT: 'chat',
  DRAW: 'draw',
  JOIN: 'join',
  REMINDER: 'reminder',
  REVEAL: 'reveal',
  /** Aviso enviado por la administración desde el panel */
  ANNOUNCEMENT: 'announcement',
} as const;

export const NotificationKindSchema = z.enum([
  NotificationKindEnum.COMMENT,
  NotificationKindEnum.REPLY,
  NotificationKindEnum.CHAT,
  NotificationKindEnum.DRAW,
  NotificationKindEnum.JOIN,
  NotificationKindEnum.REMINDER,
  NotificationKindEnum.REVEAL,
  NotificationKindEnum.ANNOUNCEMENT,
]);

export type NotificationKind = z.infer<typeof NotificationKindSchema>;

/** Pantalla de la app a la que lleva una notificación */
export const NotificationTargetSchema = z.enum(['myWish', 'wish', 'envelope', 'group', 'chat', 'reveal']);

export type NotificationTarget = z.infer<typeof NotificationTargetSchema>;

/** Tipo de mensaje del chat grupal */
export const ChatMessageKindSchema = z.enum(['mensaje', 'pista']);

export type ChatMessageKind = z.infer<typeof ChatMessageKindSchema>;

/**
 * Pantallas de la app donde puede aparecer un tip.
 * `general` = tips del juego que pueden salir en cualquier pantalla que acepte generales.
 */
export const TIP_SCREENS = [
  'general',
  'grupos',
  'grupo.resumen',
  'sobre.sellado',
  'sobre.lista',
  'deseo.detalle',
  'deseo.formulario',
  'deseos',
  'chat.lista',
  'chat.sala',
  'notificaciones',
  'unirse',
  'exclusiones',
  'revelacion',
] as const;

export const TipScreenSchema = z.enum(TIP_SCREENS);

export type TipScreen = z.infer<typeof TipScreenSchema>;
