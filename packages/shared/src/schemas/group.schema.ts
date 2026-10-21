import { z } from 'zod';
import {
  CurrencySchema,
  GROUP_MAX_PARTICIPANTS,
  GROUP_MIN_PARTICIPANTS,
  GroupStatusEnum,
  GroupStatusSchema,
  MemberRoleSchema,
} from '../enums';

/**
 * Miembro de un grupo de EntrePanas (vista pública dentro del grupo).
 * El email y las exclusiones solo se exponen al creador del grupo.
 */
export const GroupMemberSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  lastName: z.string().optional(),
  photo: z.string().optional().nullable(),
  email: z.string().email().optional(),
  role: MemberRoleSchema,
  joinedAt: z.string().or(z.date()),
  /** IDs de miembros a quienes este miembro NO puede regalar (solo visible al creador) */
  exclusions: z.array(z.string()).default([]),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

/**
 * Esquema principal de un Grupo de Amigo Secreto (respuesta de la API)
 */
export const GroupSchema = z.object({
  id: z.string().min(1, 'El ID de grupo es requerido'),
  name: z.string().min(3, 'El nombre del grupo debe tener al menos 3 caracteres'),
  description: z.string().max(500, 'Descripción máxima de 500 caracteres').optional(),
  emoji: z.string().max(16).optional(),
  creatorId: z.string().min(1, 'ID del creador requerido'),
  status: GroupStatusSchema.default(GroupStatusEnum.WAITING),
  exchangeDate: z.string().or(z.date()),
  currency: z.string().default('USD'),
  /** Presupuesto mínimo; null = sin mínimo */
  budgetMin: z.number().nonnegative().nullable().optional(),
  /** Presupuesto máximo; null = sin límite */
  budgetMax: z.number().nonnegative().nullable().optional(),
  /** @deprecated usar budgetMax */
  budget: z.number().nonnegative().optional(),
  maxParticipants: z.number().int().optional(),
  anonymousClues: z.boolean().optional(),
  inviteCode: z.string().min(4, 'Código de invitación requerido'),
  members: z.array(GroupMemberSchema).default([]),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Group = z.infer<typeof GroupSchema>;

/* ------------------------------------------------------------------
 * DTOs de entrada
 * ------------------------------------------------------------------ */

const groupFields = {
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'El nombre puede tener máximo 80 caracteres'),
  description: z.string().trim().max(500, 'Descripción máxima de 500 caracteres').optional(),
  emoji: z.string().trim().max(16).optional(),
  exchangeDate: z.coerce.date({
    required_error: 'La fecha del intercambio es obligatoria',
    invalid_type_error: 'Fecha del intercambio inválida',
  }),
  currency: CurrencySchema.default('USD'),
  budgetMin: z.number().nonnegative('El presupuesto no puede ser negativo').nullable().optional(),
  budgetMax: z.number().nonnegative('El presupuesto no puede ser negativo').nullable().optional(),
  maxParticipants: z
    .number()
    .int()
    .min(GROUP_MIN_PARTICIPANTS, `Mínimo ${GROUP_MIN_PARTICIPANTS} participantes`)
    .max(GROUP_MAX_PARTICIPANTS, `Máximo ${GROUP_MAX_PARTICIPANTS} participantes`)
    .default(GROUP_MAX_PARTICIPANTS),
  anonymousClues: z.boolean().default(true),
};

const budgetRangeIsValid = (data: { budgetMin?: number | null; budgetMax?: number | null }) =>
  data.budgetMin == null || data.budgetMax == null || data.budgetMin <= data.budgetMax;

const budgetRangeError = {
  message: 'El presupuesto mínimo no puede ser mayor que el máximo',
  path: ['budgetMin'],
};

export const CreateGroupSchema = z.object(groupFields).refine(budgetRangeIsValid, budgetRangeError);

export type CreateGroupDTO = z.infer<typeof CreateGroupSchema>;
export type CreateGroupInput = z.input<typeof CreateGroupSchema>;

/**
 * Actualización parcial. El estado NO se cambia por aquí:
 * se usan las acciones (sortear, revelar, finalizar).
 */
export const UpdateGroupSchema = z
  .object({
    name: groupFields.name.optional(),
    description: groupFields.description,
    emoji: groupFields.emoji,
    exchangeDate: groupFields.exchangeDate.optional(),
    currency: CurrencySchema.optional(),
    budgetMin: groupFields.budgetMin,
    budgetMax: groupFields.budgetMax,
    maxParticipants: groupFields.maxParticipants.removeDefault().optional(),
    anonymousClues: z.boolean().optional(),
  })
  .strict()
  .refine(budgetRangeIsValid, budgetRangeError);

export type UpdateGroupDTO = z.infer<typeof UpdateGroupSchema>;

export const JoinGroupSchema = z.object({
  inviteCode: z
    .string({ required_error: 'El código de invitación es requerido' })
    .trim()
    .toUpperCase()
    .min(4, 'El código de invitación es requerido')
    .max(20, 'Código de invitación inválido'),
});

export type JoinGroupDTO = z.infer<typeof JoinGroupSchema>;

export const SetExclusionsSchema = z.object({
  exclusions: z.array(z.string().min(1)).max(GROUP_MAX_PARTICIPANTS),
  /** Si es true (por defecto), la exclusión aplica en ambos sentidos (ej. parejas) */
  mutual: z.boolean().default(true),
});

export type SetExclusionsDTO = z.infer<typeof SetExclusionsSchema>;

/** Máximo de correos por invitación */
export const INVITE_MAX_EMAILS = 20;

export const InviteByEmailSchema = z
  .object({
    emails: z
      .array(z.string().trim().toLowerCase().email('Correo inválido'))
      .min(1, 'Indica al menos un correo')
      .max(INVITE_MAX_EMAILS, `Máximo ${INVITE_MAX_EMAILS} correos por envío`),
    message: z.string().trim().max(300, 'El mensaje puede tener máximo 300 caracteres').optional(),
  })
  .strict();

export type InviteByEmailDTO = z.infer<typeof InviteByEmailSchema>;

/* ------------------------------------------------------------------
 * Respuestas auxiliares
 * ------------------------------------------------------------------ */

export interface GroupSummary {
  id: string;
  name: string;
  emoji?: string;
  status: z.infer<typeof GroupStatusSchema>;
  exchangeDate: string | Date;
  currency: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  maxParticipants: number;
  memberCount: number;
  myRole: z.infer<typeof MemberRoleSchema>;
  creatorName: string;
  /** true si el sorteo ya se hizo y el usuario tiene asignado */
  hasAssignment: boolean;
}

export interface AssignmentView {
  groupId: string;
  receiver: {
    userId: string;
    name: string;
    lastName?: string;
    photo?: string | null;
  };
}
