import { z } from 'zod';

/**
 * Esquema de Mensaje de Chat Anónimo
 */
export const AnonymousChatMessageSchema = z.object({
  id: z.string().min(1, 'ID de mensaje requerido'),
  groupId: z.string().min(1, 'ID de grupo requerido'),
  senderId: z.string().min(1, 'ID del remitente requerido'),
  receiverId: z.string().optional(), // Puede ser mensaje directo anónimo al asignado o al grupo
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'Máximo 1000 caracteres'),
  senderAlias: z.string().default('Tu Pana Secreto 🤫'),
  isAnonymous: z.boolean().default(true),
  read: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
});

export type AnonymousChatMessage = z.infer<typeof AnonymousChatMessageSchema>;

export const SendChatMessageSchema = z.object({
  groupId: z.string().min(1, 'El ID del grupo es obligatorio'),
  receiverId: z.string().optional(),
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'Máximo 1000 caracteres'),
  senderAlias: z.string().optional().default('Tu Pana Secreto 🤫'),
  isAnonymous: z.boolean().default(true),
});

export type SendChatMessageDTO = z.infer<typeof SendChatMessageSchema>;
