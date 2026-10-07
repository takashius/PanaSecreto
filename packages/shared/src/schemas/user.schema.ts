import { z } from 'zod';

/**
 * Esquema base del modelo de Usuario
 */
export const UserSchema = z.object({
  id: z.string().min(1, 'El ID de usuario es requerido'),
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({
  email: true,
  name: true,
}).extend({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
