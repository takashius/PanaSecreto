import { api } from './client';
import type { SessionUser } from '../types/session';

/** Respuesta de login, registro y Google: el usuario + su token */
export interface SessionPayload extends SessionUser {
  token: string;
  /** Solo con Google: true si la cuenta se acaba de crear */
  isNew?: boolean;
}

export interface RegisterInput {
  name: string;
  lastName?: string;
  nickname?: string;
  email: string;
  phone?: string;
  password: string;
}

export const login = (email: string, password: string) =>
  api<SessionPayload>('/api/user/login', { method: 'POST', body: { email, password, client: 'mobile' }, auth: false });

export const register = (input: RegisterInput) =>
  api<SessionPayload>('/api/user/register', { method: 'POST', body: input, auth: false });

export const fetchMe = () => api<SessionUser>('/api/user/me');

export const logout = () => api<{ ok: boolean }>('/api/user/logout', { method: 'POST', timeoutMs: 5000 });

export const requestRecoveryCode = (email: string) =>
  api<{ ok: boolean; message: string; devCode?: number }>('/api/user/recovery/request', {
    method: 'POST',
    body: { email },
    auth: false,
  });

export const resetPassword = (email: string, code: string, newPass: string) =>
  api<{ ok: boolean; message: string }>('/api/user/recovery', {
    method: 'POST',
    body: { email, code, newPass },
    auth: false,
  });

export const exchangeGoogleTicket = (ticket: string) =>
  api<SessionPayload>('/api/user/google/exchange', { method: 'POST', body: { ticket }, auth: false });
