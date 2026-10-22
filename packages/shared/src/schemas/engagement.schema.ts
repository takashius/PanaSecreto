import { z } from 'zod';
import { ChatMessageKindSchema, GenderSchema, TipScreenSchema } from '../enums';

/* ------------------------------------------------------------------
 * Alias del grupo (uno por persona y grupo; se usa en el sobre, el chat y los comentarios)
 * ------------------------------------------------------------------ */

export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 30;
/** Cuántas sugerencias se muestran por vez */
export const ALIAS_SUGGESTIONS_PER_PAGE = 5;

export const SetAliasSchema = z
  .object({
    alias: z
      .string({ required_error: 'Escribe o elige un alias' })
      .trim()
      .min(ALIAS_MIN_LENGTH, `El alias debe tener al menos ${ALIAS_MIN_LENGTH} caracteres`)
      .max(ALIAS_MAX_LENGTH, `El alias puede tener máximo ${ALIAS_MAX_LENGTH} caracteres`),
    emoji: z.string().trim().max(16).optional(),
  })
  .strict();

export type SetAliasDTO = z.infer<typeof SetAliasSchema>;

export const AliasSuggestionInputSchema = z
  .object({
    text: z.string().trim().min(ALIAS_MIN_LENGTH).max(ALIAS_MAX_LENGTH),
    gender: GenderSchema,
    emoji: z.string().trim().max(16).optional(),
    active: z.boolean().default(true),
  })
  .strict();

export type AliasSuggestionInput = z.infer<typeof AliasSuggestionInputSchema>;

export const AliasSuggestionUpdateSchema = AliasSuggestionInputSchema.partial().strict();

export interface AliasSuggestionView {
  id: string;
  text: string;
  gender: z.infer<typeof GenderSchema>;
  emoji?: string;
  active: boolean;
}

/* ------------------------------------------------------------------
 * Tips rotativos
 * ------------------------------------------------------------------ */

export const TIP_MAX_LENGTH = 220;

export const TipInputSchema = z
  .object({
    text: z.string().trim().min(5, 'El tip es muy corto').max(TIP_MAX_LENGTH, `Máximo ${TIP_MAX_LENGTH} caracteres`),
    screens: z.array(TipScreenSchema).min(1, 'Elige al menos una pantalla'),
    active: z.boolean().default(true),
    /** Mayor peso = sale más seguido (1 a 5) */
    weight: z.number().int().min(1).max(5).default(1),
  })
  .strict();

export type TipInput = z.infer<typeof TipInputSchema>;

export const TipUpdateSchema = TipInputSchema.partial().strict();

export interface TipView {
  id: string;
  text: string;
  screens: z.infer<typeof TipScreenSchema>[];
  active: boolean;
  weight: number;
}

/* ------------------------------------------------------------------
 * Comentarios anónimos de un deseo
 * ------------------------------------------------------------------ */

export const COMMENT_MAX_LENGTH = 500;

export const CreateCommentSchema = z
  .object({
    text: z
      .string({ required_error: 'Escribe un comentario' })
      .trim()
      .min(1, 'Escribe un comentario')
      .max(COMMENT_MAX_LENGTH, `Máximo ${COMMENT_MAX_LENGTH} caracteres`),
  })
  .strict();

export type CreateCommentDTO = z.infer<typeof CreateCommentSchema>;

export interface WishCommentView {
  id: string;
  /** 'me' = lo escribí yo */
  author: 'me' | 'other';
  /** Quién lo escribió dentro del hilo: el dueño del deseo o quien le regala */
  authorRole: 'owner' | 'giver';
  text: string;
  createdAt: string | Date;
}

/* ------------------------------------------------------------------
 * Chat grupal anónimo
 * ------------------------------------------------------------------ */

export const CHAT_MESSAGE_MAX_LENGTH = 500;

export const SendGroupMessageSchema = z
  .object({
    text: z
      .string({ required_error: 'El mensaje no puede estar vacío' })
      .trim()
      .min(1, 'El mensaje no puede estar vacío')
      .max(CHAT_MESSAGE_MAX_LENGTH, `Máximo ${CHAT_MESSAGE_MAX_LENGTH} caracteres`),
    kind: ChatMessageKindSchema.default('mensaje'),
  })
  .strict();

export type SendGroupMessageDTO = z.infer<typeof SendGroupMessageSchema>;

/** Mensaje tal como lo recibe la app: nunca incluye el usuario real, solo el alias */
export interface GroupMessageView {
  id: string;
  groupId: string;
  alias: string;
  aliasEmoji: string;
  text: string;
  kind: z.infer<typeof ChatMessageKindSchema>;
  /** Solo en la respuesta a quien lo envió o en el historial propio */
  mine?: boolean;
  createdAt: string | Date;
}
