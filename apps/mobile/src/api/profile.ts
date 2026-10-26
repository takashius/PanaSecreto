import { api } from './client';
import { localImageFile } from './localUploadFile';
import type { SessionUser } from '../types/session';

/** Usuario tal como lo devuelven PATCH /me, /upload y DELETE /photo (sin token) */
type ApiUser = Partial<SessionUser> & { _id: string };

export interface ProfileUpdateInput {
  name?: string;
  lastName?: string | null;
  nickname?: string | null;
  /** Con prefijo internacional (+58…) o null para quitarlo */
  phone?: string | null;
  notifyEmail?: boolean;
  notifyComments?: boolean;
  notifyPush?: boolean;
}

/**
 * Convierte la respuesta en un parche para la sesión. Los campos que el backend
 * omite porque quedaron vacíos (foto, apodo, teléfono…) se limpian explícitamente.
 */
export function toSessionPatch(u: ApiUser): Partial<SessionUser> {
  return {
    name: u.name,
    lastName: u.lastName ?? undefined,
    phone: u.phone || undefined,
    photo: u.photo ?? null,
    nickname: u.nickname || undefined,
    notifyEmail: u.notifyEmail !== false,
    notifyComments: u.notifyComments !== false,
    notifyPush: u.notifyPush !== false,
    ...(u.hasPassword !== undefined ? { hasPassword: u.hasPassword !== false } : {}),
  };
}

export const updateProfile = (input: ProfileUpdateInput) =>
  api<ApiUser>('/api/user/me', { method: 'PATCH', body: input }).then(toSessionPatch);

/** Sube la foto de perfil (multipart, campo "photo"); el backend borra la anterior */
export function uploadProfilePhoto(uri: string) {
  const form = new FormData();
  form.append('photo', localImageFile(uri));
  return api<ApiUser>('/api/user/upload', { method: 'POST', form, timeoutMs: 45000 }).then(toSessionPatch);
}

export const removeProfilePhoto = () => api<ApiUser>('/api/user/photo', { method: 'DELETE' }).then(toSessionPatch);

/** Sin `oldPassword` solo funciona en cuentas de Google que aún no tienen contraseña propia */
export const changePassword = (newPassword: string, oldPassword?: string) =>
  api<{ ok: boolean; message: string }>('/api/user/change-password', {
    method: 'POST',
    body: oldPassword ? { oldPassword, newPassword } : { newPassword },
  });
