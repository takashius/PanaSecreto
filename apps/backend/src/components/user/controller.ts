import * as store from './store';
import { UserRole } from '../../config/roles';

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

export function changePassword(userId: string, oldPass: string, newPass: string) {
  if (!newPass || newPass.length < 6) {
    return Promise.resolve({
      status: 400,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
  }
  return store.changePassword(userId, oldPass, newPass);
}

export function recoveryStepOne(email: string) {
  if (!email) {
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

export function createUserAdmin(data: {
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
  return store.createUserAdmin(data);
}

export function updateUserAdmin(id: string, payload: any) {
  return store.updateUserAdmin(id, payload);
}

export function setUserRole(id: string, role: string) {
  return store.setUserRole(id, role);
}

export function setUserActive(id: string, active: boolean) {
  return store.setUserActive(id, active);
}

export function setUserPassword(id: string, password: string) {
  if (!password || password.length < 6) {
    return Promise.resolve({
      status: 400,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
  }
  return store.setUserPassword(id, password);
}

export function setUserForcePasswordChange(id: string, force: boolean) {
  return store.setUserForcePasswordChange(id, force);
}
