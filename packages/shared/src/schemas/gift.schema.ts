import { z } from 'zod';

/**
 * Esquema de Sugerencia de Regalo / Lista de Deseos (Wishlist)
 */
export const GiftSuggestionSchema = z.object({
  id: z.string().min(1, 'ID de sugerencia requerido'),
  groupId: z.string().min(1, 'ID de grupo requerido'),
  userId: z.string().min(1, 'ID de usuario requerido'),
  title: z.string().min(2, 'El título del regalo debe tener al menos 2 caracteres'),
  description: z.string().max(500, 'Descripción máxima de 500 caracteres').optional(),
  estimatedPrice: z.number().nonnegative('El precio estimado no puede ser negativo').optional(),
  currency: z.string().default('USD').optional(),
  productUrl: z.string().url('URL inválida').optional(),
  isFavorite: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type GiftSuggestion = z.infer<typeof GiftSuggestionSchema>;

export const CreateGiftSuggestionSchema = GiftSuggestionSchema.pick({
  groupId: true,
  title: true,
}).extend({
  description: z.string().max(500).optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  currency: z.string().default('USD').optional(),
  productUrl: z.string().url().optional(),
  isFavorite: z.boolean().default(false).optional(),
});

export type CreateGiftSuggestionDTO = z.infer<typeof CreateGiftSuggestionSchema>;
