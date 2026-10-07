import { z } from 'zod';
import { GroupStatusSchema, MemberRoleSchema, GroupStatusEnum } from '../enums';

/**
 * Miembro de un grupo de PanaSecreto
 */
export const GroupMemberSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: MemberRoleSchema,
  joinedAt: z.string().or(z.date()),
  assignedTargetId: z.string().optional(), // ID del amigo secreto asignado
  exclusions: z.array(z.string()).default([]), // IDs de personas con las que no puede emparejarse
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

/**
 * Esquema principal de un Grupo de Amigo Secreto
 */
export const GroupSchema = z.object({
  id: z.string().min(1, 'El ID de grupo es requerido'),
  name: z.string().min(3, 'El nombre del grupo debe tener al menos 3 caracteres'),
  description: z.string().max(500, 'Descripción máxima de 500 caracteres').optional(),
  creatorId: z.string().min(1, 'ID del creador requerido'),
  status: GroupStatusSchema.default(GroupStatusEnum.WAITING),
  exchangeDate: z.string().or(z.date()),
  budget: z.number().nonnegative('El presupuesto no puede ser negativo').optional(),
  currency: z.string().default('USD'),
  inviteCode: z.string().min(4, 'Código de invitación requerido'),
  members: z.array(GroupMemberSchema).default([]),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Group = z.infer<typeof GroupSchema>;

export const CreateGroupSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().max(500).optional(),
  exchangeDate: z.string().or(z.date()),
  budget: z.number().nonnegative().optional(),
  currency: z.string().default('USD').optional(),
});

export type CreateGroupDTO = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = CreateGroupSchema.partial().extend({
  status: GroupStatusSchema.optional(),
});

export type UpdateGroupDTO = z.infer<typeof UpdateGroupSchema>;

export const JoinGroupSchema = z.object({
  inviteCode: z.string().min(4, 'El código de invitación es requerido'),
});

export type JoinGroupDTO = z.infer<typeof JoinGroupSchema>;
