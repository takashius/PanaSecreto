import { z } from 'zod';
import { CurrencySchema } from '../enums';

/** Máximo de deseos por persona en un grupo */
export const WISHLIST_MAX_ITEMS = 20;

const httpUrl = z
  .string()
  .trim()
  .url('URL inválida')
  .max(2000)
  .refine((value) => /^https?:\/\//i.test(value), 'La URL debe empezar por http:// o https://');

/**
 * Deseo de la lista de regalos (wishlist) de un miembro dentro de un grupo
 */
export const WishSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  estimatedPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  productUrl: z.string().optional(),
  /** Imagen del producto (Cloudinary) */
  imageUrl: z.string().optional(),
  isFavorite: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Wish = z.infer<typeof WishSchema>;

export const CreateWishSchema = z
  .object({
    title: z
      .string({ required_error: 'El título es obligatorio' })
      .trim()
      .min(2, 'El título debe tener al menos 2 caracteres')
      .max(120, 'El título puede tener máximo 120 caracteres'),
    description: z.string().trim().max(500, 'Descripción máxima de 500 caracteres').optional(),
    estimatedPrice: z.number().nonnegative('El precio estimado no puede ser negativo').nullable().optional(),
    currency: CurrencySchema.optional(),
    productUrl: httpUrl.optional(),
    isFavorite: z.boolean().default(false),
  })
  .strict();

export type CreateWishDTO = z.infer<typeof CreateWishSchema>;

export const UpdateWishSchema = z
  .object({
    title: CreateWishSchema.shape.title.optional(),
    description: CreateWishSchema.shape.description,
    estimatedPrice: CreateWishSchema.shape.estimatedPrice,
    currency: CurrencySchema.optional(),
    productUrl: httpUrl.nullable().optional(),
    isFavorite: z.boolean().optional(),
    /** true para quitar la imagen actual sin subir otra */
    removeImage: z.boolean().optional(),
  })
  .strict();

export type UpdateWishDTO = z.infer<typeof UpdateWishSchema>;

/** Tamaño máximo de imagen de un deseo (MB) */
export const WISH_IMAGE_MAX_MB = 8;

/** @deprecated usar WishSchema */
export const GiftSuggestionSchema = WishSchema;
/** @deprecated usar Wish */
export type GiftSuggestion = Wish;
/** @deprecated usar CreateWishSchema */
export const CreateGiftSuggestionSchema = CreateWishSchema;
/** @deprecated usar CreateWishDTO */
export type CreateGiftSuggestionDTO = CreateWishDTO;
