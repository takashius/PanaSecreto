import type { ProfileView } from '../types/session';

/** Perfil de ejemplo. Se reemplaza por GET /api/user/me al conectar la API. */
export const MOCK_PROFILE: ProfileView = {
  fullname: 'Carlos Pérez',
  nickname: 'Carlitos',
  email: 'carlos@ejemplo.com',
  phone: '4121234567',
  photoUri: null,
  notifyEmail: true,
  notifyComments: true,
  notifyPush: true,
};
