import * as store from './store';
import type { GoogleProfile } from '../../services/google';
import { UserRole } from '../../config/roles';
import type { UploadedImage } from '../../types/general';

export function loginUser(email: string, password: string, client?: 'web' | 'mobile') {
  if (!email || !password) {
    return Promise.resolve({
      status: 400,
      message: 'Correo y contraseña son requeridos.',
    });
  }
  return store.login(email, password, client);
}

export function registerUser(data: {
  name: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
}) {
  if (!data?.name || !data?.email || !data?.password) {
    return Promise.resolve({
      status: 400,
      message: 'Nombre, correo y contraseña son requeridos.',
    });
  }
  return store.register(data);
}

export function logoutUser(userId: string, token: string) {
  return store.logout(userId, token);
}

export function logoutAll(userId: string) {
  return store.logoutAll(userId);
}

export function getUserProfile(userId: string) {
  return store.getProfile(userId);
}

export function acceptLegal(userId: string) {
  return store.acceptUserLegal(userId);
}

function invalidNewPassword(newPass: unknown) {
  return typeof newPass !== 'string' || newPass.length < 6;
}

export function changePassword(userId: string, oldPass: string, newPass: string, currentToken?: string) {
  if (invalidNewPassword(newPass)) {
    return Promise.resolve({
      status: 400,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
  }
  return store.changePassword(userId, oldPass, newPass, currentToken);
}

export function changeRequiredPassword(userId: string, newPass: string, currentToken?: string) {
  if (invalidNewPassword(newPass)) {
    return Promise.resolve({
      status: 400,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
  }
  return store.changeRequiredPassword(userId, newPass, currentToken);
}

export function recoveryStepOne(email: unknown) {
  if (!email || typeof email !== 'string') {
    return Promise.resolve({
      status: 400,
      message: 'El correo electrónico es requerido.',
    });
  }
  return store.recoveryStepOne(email);
}

export function recoveryStepTwo(email: string, code: number, newPass: string) {
  if (!email || !code || !newPass) {
    return Promise.resolve({
      status: 400,
      message: 'Correo, código y nueva contraseña son requeridos.',
    });
  }
  return store.recoveryStepTwo(email, code, newPass);
}

/* Administracion */
export function listUsersAdmin(filters: {
  q?: string;
  role?: string;
  active?: string;
  page?: number;
  limit?: number;
}) {
  return store.listUsersAdmin(filters);
}

export function getUserAdminDetail(id: string) {
  return store.getUserAdminDetail(id);
}

export function createUserAdmin(actorRole: string | string[], data: {
  name: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole | string;
  active?: boolean;
}) {
  if (!data?.name || !data?.email || !data?.password) {
    return Promise.resolve({
      status: 400,
      message: 'Nombre, correo y contraseña son obligatorios.',
    });
  }
  return store.createUserAdmin(actorRole, data);
}

export function updateUserAdmin(actorRole: string | string[], id: string, payload: unknown) {
  return store.updateUserAdmin(actorRole, id, payload);
}

export function setUserRole(actorId: string, id: string, role: unknown) {
  return store.setUserRole(actorId, id, role);
}

export function setUserActive(
  actor: { _id: string; role: string | string[] },
  id: string,
  active: boolean
) {
  return store.setUserActive(actor, id, active);
}

export function setUserPassword(actorRole: string | string[], id: string, password: string) {
  if (invalidNewPassword(password)) {
    return Promise.resolve({
      status: 400,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
  }
  return store.setUserPassword(actorRole, id, password);
}

export function setUserForcePasswordChange(actorRole: string | string[], id: string, force: boolean) {
  return store.setUserForcePasswordChange(actorRole, id, force);
}

export function updateProfile(userId: string, body: unknown) {
  if (!body || typeof body !== 'object') {
    return Promise.resolve({ status: 400, message: 'Cuerpo de la petición inválido.' });
  }
  const data = body as store.ProfileUpdate;
  if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
    return Promise.resolve({
      status: 400,
      message: 'El nombre no puede estar vacío.',
    });
  }
  return store.updateProfile(userId, data);
}

export function uploadUserPhoto(userId: string, image?: UploadedImage) {
  return store.uploadUserPhoto(userId, image);
}

export function removeUserPhoto(userId: string) {
  return store.removeUserPhoto(userId);
}


export function loginWithGoogle(profile: GoogleProfile, client?: 'web' | 'mobile') {
  return store.loginWithGoogle(profile, client);
}

export function createAuthTicket(session: { _id: string; token: string; isNew?: boolean }) {
  return store.createAuthTicket(session);
}

export function exchangeAuthTicket(ticket: unknown) {
  return store.exchangeAuthTicket(ticket);
}
