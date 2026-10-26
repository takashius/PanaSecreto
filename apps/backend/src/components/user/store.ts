import { createHash, randomBytes, randomInt } from 'crypto';
import { User } from './model';
import type { FilterQuery } from 'mongoose';
import type { IUserDocument } from '../../types/users';
import { describeSaveError } from '../../middleware/controllerError';
import {
  assignableRolesFor,
  canAccessWeb,
  canManageTarget,
  isUserRole,
  ROLES,
  UserRole,
} from '../../config/roles';
import config from '../../config/commons';
import { sanitizeEmail } from '../../utils/sanitizeEmail';
import { StoreResponse } from '../../types/general';
import { compare } from 'bcryptjs';
import { deleteImage } from '../../services/storage';
import type { UploadedImage } from '../../types/general';
import { sendMail } from '../../services/mail';
import { recoveryCodeEmail } from '../../services/mailTemplates';
import { notifyAccountCreated, notifyPasswordChanged, notifyWelcome } from '../../services/notifications';
import type { GoogleProfile } from '../../services/google';
import { AuthTicket } from './authTicket.model';

const MAX_RECOVERY_ATTEMPTS = 5;
const RECOVERY_CODE_MINUTES = 15;
/** Tiempo mínimo entre dos envíos de código a la misma cuenta */
const RECOVERY_RESEND_SECONDS = 60;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Carga el usuario objetivo y verifica que el actor tenga jerarquía para gestionarlo. */
async function loadManageableTarget(
  actorRole: string | string[],
  id: string
): Promise<{ user: IUserDocument; error?: undefined } | { user?: undefined; error: StoreResponse }> {
  const user = await User.findById(id);
  if (!user) return { error: { status: 404, message: 'Usuario no encontrado.' } };
  if (!canManageTarget(actorRole, user.role)) {
    return {
      error: {
        status: 403,
        message: { code: 'INSUFFICIENT_PERMISSIONS', message: 'No puedes gestionar a este usuario.' },
      },
    };
  }
  return { user };
}

/** Datos mínimos para notificar por correo a un usuario */
function recipientOf(user: { _id: unknown; name: string; lastName?: string; email: string; active?: boolean }) {
  return { id: String(user._id), name: user.name, lastName: user.lastName, email: user.email, active: user.active };
}

function displayFullName(user: { name?: string; lastName?: string }): string {
  return [user.name, user.lastName].filter(Boolean).join(' ');
}

const PUBLIC_USER_FIELDS = '-password -tokens -__v -recoveryCode -recoveryCodeExpires -recoveryAttempts -googleId';

/** Respuesta de sesión común a login, registro y Google */
function sessionPayload(user: IUserDocument, token: string, extra: Record<string, unknown> = {}) {
  return {
    _id: String(user._id),
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    photo: user.photo,
    nickname: user.nickname,
    gender: user.gender,
    notifyEmail: user.notifyEmail !== false,
    notifyComments: user.notifyComments !== false,
    role: user.role,
    hasPassword: user.hasPassword !== false,
    googleLinked: Boolean(user.googleId),
    forcePasswordChangeOnNextLogin: user.forcePasswordChangeOnNextLogin,
    token,
    ...extra,
  };
}

export async function login(
  emailRaw: string,
  passwordRaw: string,
  client?: 'web' | 'mobile'
): Promise<StoreResponse> {
  const email = sanitizeEmail(emailRaw);
  try {
    const user = await User.findByCredentials(email, passwordRaw);
    if (!user.active) {
      return {
        status: 403,
        message: { code: 'USER_INACTIVE', message: 'Tu cuenta ha sido desactivada por un administrador.' },
      };
    }

    if (client === 'web' && !canAccessWeb(user.role)) {
      return {
        status: 403,
        message: {
          code: 'WEB_ACCESS_DENIED',
          message: 'El acceso al panel web está reservado para administradores u organizadores.',
        },
      };
    }

    const token = await user.generateAuthToken();
    return { status: 200, message: sessionPayload(user, token) };
  } catch (error) {
    return {
      status: 400,
      message: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' },
      detail: error,
    };
  }
}

export async function register(data: {
  name: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
}): Promise<StoreResponse> {
  try {
    const email = sanitizeEmail(data.email);
    const existing = await User.findOne({ email });
    if (existing) {
      return {
        status: 400,
        message: {
          code: 'EMAIL_TAKEN',
          message: existing.googleId
            ? 'Ese correo ya está registrado con Google. Usa «Continuar con Google».'
            : 'Ya existe una cuenta registrada con este correo.',
          email: 'Ya existe una cuenta registrada con este correo.',
        },
      };
    }
    const nickname = typeof data.nickname === 'string' ? data.nickname.trim().replace(/^@/, '').slice(0, 30) : '';

    const user = new User({
      name: data.name.trim(),
      lastName: data.lastName?.trim(),
      nickname: nickname || undefined,
      email,
      phone: data.phone?.trim(),
      password: data.password,
      role: [ROLES.USER],
      active: true,
    });

    await user.save();
    notifyWelcome(recipientOf(user));
    const token = await user.generateAuthToken();
    return { status: 201, message: sessionPayload(user, token) };
  } catch (error) {
    const safe = describeSaveError(error, 'Error al registrar usuario.');
    return {
      status: safe.status,
      message: safe.message,
      detail: error,
    };
  }
}

export async function logout(userId: string, currentToken: string): Promise<StoreResponse> {
  try {
    await User.updateOne(
      { _id: userId },
      { $pull: { tokens: { token: currentToken } } }
    );
    return { status: 200, message: { ok: true, message: 'Sesión cerrada correctamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al cerrar sesión.', detail: error };
  }
}

export async function logoutAll(userId: string): Promise<StoreResponse> {
  try {
    await User.updateOne({ _id: userId }, { $set: { tokens: [] } });
    return { status: 200, message: { ok: true, message: 'Todas las sesiones fueron cerradas.' } };
  } catch (error) {
    return { status: 500, message: 'Error al cerrar sesiones.', detail: error };
  }
}

export async function getProfile(userId: string): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    return { status: 200, message: user };
  } catch (error) {
    return { status: 500, message: 'Error al consultar perfil.', detail: error };
  }
}

export async function changePassword(
  userId: string,
  oldPass: string,
  newPass: string,
  currentToken?: string
): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    // Las cuentas creadas con Google no tienen contraseña propia: la crean sin pedir la actual
    if (user.hasPassword !== false) {
      if (!oldPass) {
        return { status: 400, message: 'La contraseña actual es requerida.' };
      }
      const match = await compare(oldPass, user.password || '');
      if (!match) {
        return { status: 400, message: 'La contraseña actual no es correcta.' };
      }
    }

    user.password = newPass;
    user.hasPassword = true;
    user.forcePasswordChangeOnNextLogin = false;
    // Cierra las demás sesiones; conserva solo la actual
    user.tokens = user.tokens.filter((t) => t.token === currentToken);
    await user.save();
    notifyPasswordChanged(recipientOf(user), 'self');

    return { status: 200, message: { ok: true, message: 'Contraseña actualizada exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al cambiar contraseña.', detail: error };
  }
}

/**
 * Cambio obligatorio de contraseña: solo permitido si el usuario tiene
 * forcePasswordChangeOnNextLogin = true (no requiere la contraseña actual).
 */
export async function changeRequiredPassword(
  userId: string,
  newPass: string,
  currentToken?: string
): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    if (!user.forcePasswordChangeOnNextLogin) {
      return {
        status: 403,
        message: {
          code: 'PASSWORD_CHANGE_NOT_REQUIRED',
          message: 'Tu cuenta no requiere cambio obligatorio. Usa el cambio de contraseña con tu clave actual.',
        },
      };
    }

    user.password = newPass;
    user.forcePasswordChangeOnNextLogin = false;
    user.tokens = user.tokens.filter((t) => t.token === currentToken);
    await user.save();
    notifyPasswordChanged(recipientOf(user), 'required');

    return { status: 200, message: { ok: true, message: 'Contraseña actualizada exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al cambiar contraseña.', detail: error };
  }
}

export async function recoveryStepOne(emailRaw: string): Promise<StoreResponse> {
  try {
    const email = sanitizeEmail(emailRaw);
    const genericOk: StoreResponse = {
      status: 200,
      message: { ok: true, message: 'Si el correo existe, recibirás un código.' },
    };
    const user = await User.findOne({ email });
    // Misma respuesta si no existe o está inactivo: no se filtra qué correos están registrados
    if (!user || user.active === false) return genericOk;

    // Anti-spam por cuenta: si se envió un código hace menos de 60 s, no se envía otro
    if (user.recoveryCodeExpires) {
      const issuedAt = user.recoveryCodeExpires.getTime() - RECOVERY_CODE_MINUTES * 60 * 1000;
      if (Date.now() - issuedAt < RECOVERY_RESEND_SECONDS * 1000) return genericOk;
    }

    const code = randomInt(100000, 1000000);
    user.recoveryCode = code;
    user.recoveryCodeExpires = new Date(Date.now() + RECOVERY_CODE_MINUTES * 60 * 1000);
    user.recoveryAttempts = 0;
    await user.save();

    const mail = recoveryCodeEmail({ name: user.name, code, minutes: RECOVERY_CODE_MINUTES });
    const sent = await sendMail({
      to: { email: user.email, name: displayFullName(user) },
      ...mail,
      customId: `recovery-${user._id}`,
    });
    if (!sent.ok) {
      console.error(`[AUTH RECOVERY] No se pudo enviar el código a ${email}: ${sent.error}`);
    }
    return {
      status: 200,
      message: {
        ok: true,
        message: 'Si el correo existe, recibirás un código.',
        // Solo en desarrollo/test se expone el código para facilitar pruebas
        devCode: config.dev ? code : undefined,
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al procesar recuperación.', detail: error };
  }
}

export async function recoveryStepTwo(
  emailRaw: string,
  code: number,
  newPass: string
): Promise<StoreResponse> {
  try {
    const email = sanitizeEmail(emailRaw);
    const invalid: StoreResponse = {
      status: 400,
      message: 'El código de recuperación es inválido o ha expirado.',
    };
    if (!newPass || newPass.length < 6) {
      return { status: 400, message: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    const user = await User.findOne({ email });
    if (
      !user ||
      !user.recoveryCode ||
      !user.recoveryCodeExpires ||
      user.recoveryCodeExpires <= new Date()
    ) {
      return invalid;
    }

    if (user.recoveryCode !== code) {
      // Contador por cuenta: tras N fallos se invalida el código
      user.recoveryAttempts = (user.recoveryAttempts || 0) + 1;
      if (user.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        user.recoveryCode = undefined;
        user.recoveryCodeExpires = undefined;
        user.recoveryAttempts = 0;
      }
      await user.save();
      return invalid;
    }

    user.password = newPass;
    user.hasPassword = true;
    user.recoveryCode = undefined;
    user.recoveryCodeExpires = undefined;
    user.recoveryAttempts = 0;
    user.tokens = []; // Cerrar todas las sesiones previas
    await user.save();
    notifyPasswordChanged(recipientOf(user), 'recovery');

    return { status: 200, message: { ok: true, message: 'Contraseña restablecida exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al restablecer contraseña.', detail: error };
  }
}

/* ==============================================================
   INICIO DE SESIÓN CON GOOGLE
   ============================================================== */

const TICKET_MINUTES = 5;
const hashTicket = (ticket: string) => createHash('sha256').update(ticket).digest('hex');

function splitGoogleName(profile: GoogleProfile): { name: string; lastName?: string } {
  if (profile.givenName) return { name: profile.givenName, lastName: profile.familyName };
  const parts = (profile.name || profile.email.split('@')[0]).trim().split(/\s+/);
  return { name: parts[0] || 'Pana', lastName: parts.slice(1).join(' ') || undefined };
}

/**
 * Inicia sesión (o crea la cuenta) con un perfil de Google ya verificado.
 * - Busca por googleId; si no, por correo verificado y vincula la cuenta existente.
 * - Si no existe, crea una cuenta USER sin contraseña propia (hasPassword = false).
 */
export async function loginWithGoogle(profile: GoogleProfile, client?: 'web' | 'mobile'): Promise<StoreResponse> {
  try {
    if (!profile.emailVerified) {
      return {
        status: 403,
        message: { code: 'GOOGLE_EMAIL_NOT_VERIFIED', message: 'Tu correo de Google no está verificado.' },
      };
    }
    let isNew = false;
    let user = await User.findOne({ googleId: profile.sub });
    if (!user) {
      user = await User.findOne({ email: sanitizeEmail(profile.email) });
      if (user) {
        // Vincula la cuenta existente (mismo correo verificado por Google)
        user.googleId = profile.sub;
        if (!user.photo && profile.picture) user.photo = profile.picture;
      }
    }
    if (user && user.active === false) {
      return {
        status: 403,
        message: { code: 'USER_INACTIVE', message: 'Tu cuenta ha sido desactivada por un administrador.' },
      };
    }
    if (!user) {
      if (client === 'web') {
        return {
          status: 403,
          message: { code: 'WEB_ACCESS_DENIED', message: 'No hay una cuenta del panel con ese correo de Google.' },
        };
      }
      isNew = true;
      user = new User({
        ...splitGoogleName(profile),
        email: sanitizeEmail(profile.email),
        photo: profile.picture,
        googleId: profile.sub,
        // Contraseña aleatoria que nadie conoce: la cuenta entra con Google o crea una propia luego
        password: randomBytes(24).toString('base64url'),
        hasPassword: false,
        role: [ROLES.USER],
        active: true,
      });
    }
    if (client === 'web' && !canAccessWeb(user.role)) {
      return {
        status: 403,
        message: {
          code: 'WEB_ACCESS_DENIED',
          message: 'El acceso al panel web está reservado para administradores u organizadores.',
        },
      };
    }
    // generateAuthToken guarda el documento (incluye el vínculo o la cuenta nueva)
    const token = await user.generateAuthToken();
    if (isNew) notifyWelcome(recipientOf(user));
    return { status: isNew ? 201 : 200, message: sessionPayload(user, token, { isNew }) };
  } catch (error) {
    const safe = describeSaveError(error, 'Error al iniciar sesión con Google.');
    return { status: safe.status, message: safe.message, detail: error };
  }
}

/** Crea un ticket de un solo uso con la sesión ya emitida (flujo por navegador) */
export async function createAuthTicket(session: { _id: string; token: string; isNew?: boolean }): Promise<string> {
  const ticket = randomBytes(32).toString('base64url');
  await AuthTicket.create({
    ticketHash: hashTicket(ticket),
    user: session._id,
    token: session.token,
    newAccount: Boolean(session.isNew),
    expiresAt: new Date(Date.now() + TICKET_MINUTES * 60 * 1000),
  });
  return ticket;
}

/** Canjea el ticket (una sola vez) por la sesión */
export async function exchangeAuthTicket(ticket: unknown): Promise<StoreResponse> {
  const invalid: StoreResponse = {
    status: 400,
    message: { code: 'TICKET_INVALID', message: 'El inicio de sesión expiró. Intenta de nuevo.' },
  };
  try {
    if (typeof ticket !== 'string' || ticket.length < 20 || ticket.length > 200) return invalid;
    const found = await AuthTicket.findOneAndDelete({ ticketHash: hashTicket(ticket), expiresAt: { $gt: new Date() } });
    if (!found) return invalid;
    const user = await User.findOne({ _id: found.user, 'tokens.token': found.token });
    if (!user || user.active === false) return invalid;
    return { status: 200, message: sessionPayload(user, found.token, { isNew: found.newAccount }) };
  } catch (error) {
    return { status: 500, message: 'Error al completar el inicio de sesión.', detail: error };
  }
}

/* ==============================================================
   MÓDULO DE GESTIÓN ADMINISTRATIVA DE USUARIOS
   ============================================================== */

export async function listUsersAdmin(filters: {
  q?: string;
  role?: string;
  active?: string;
  page?: number;
  limit?: number;
}): Promise<StoreResponse> {
  try {
    const query: FilterQuery<IUserDocument> = {};

    if (filters.active === 'true') query.active = true;
    if (filters.active === 'false') query.active = false;

    if (filters.role && isUserRole(filters.role)) {
      query.role = filters.role;
    }

    if (typeof filters.q === 'string' && filters.q.trim()) {
      const regex = new RegExp(escapeRegex(filters.q.trim().slice(0, 100)), 'i');
      query.$or = [{ name: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      User.find(query)
        .select(PUBLIC_USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      status: 200,
      message: {
        results,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al listar usuarios para administración.', detail: error };
  }
}

export async function getUserAdminDetail(id: string): Promise<StoreResponse> {
  try {
    const user = await User.findById(id).select(PUBLIC_USER_FIELDS);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    return { status: 200, message: user };
  } catch (error) {
    return { status: 500, message: 'Error al consultar usuario.', detail: error };
  }
}

export async function createUserAdmin(actorRole: string | string[], data: {
  name: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole | string;
  active?: boolean;
}): Promise<StoreResponse> {
  try {
    const requestedRole = (data.role || ROLES.USER) as string;
    if (!isUserRole(requestedRole)) {
      return { status: 400, message: 'Rol inválido.' };
    }
    if (!assignableRolesFor(actorRole).includes(requestedRole)) {
      return {
        status: 403,
        message: { code: 'INSUFFICIENT_PERMISSIONS', message: 'No puedes asignar ese rol.' },
      };
    }

    const email = sanitizeEmail(data.email);
    const existing = await User.findOne({ email });
    if (existing) {
      return { status: 400, message: 'Ya existe un usuario con este correo electrónico.' };
    }

    const user = new User({
      name: data.name.trim(),
      lastName: data.lastName?.trim(),
      middleName: data.middleName?.trim(),
      email,
      phone: data.phone?.trim(),
      password: data.password,
      role: [requestedRole],
      active: data.active !== false,
      forcePasswordChangeOnNextLogin: true,
    });

    await user.save();
    notifyAccountCreated(recipientOf(user), requestedRole);

    const created = await User.findById(user._id).select(PUBLIC_USER_FIELDS);
    return { status: 201, message: created };
  } catch (error) {
    const safe = describeSaveError(error, 'Error al crear usuario.');
    return { status: safe.status, message: safe.message, detail: error };
  }
}

export async function updateUserAdmin(
  actorRole: string | string[],
  id: string,
  payload: unknown
): Promise<StoreResponse> {
  try {
    const target = await loadManageableTarget(actorRole, id);
    if (target.error) return target.error;

    const allowed = ['name', 'lastName', 'middleName', 'phone'];
    const input = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const update: Record<string, string> = {};
    for (const key of allowed) {
      if (input[key] !== undefined && input[key] !== null) update[key] = String(input[key]);
    }

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select(
      PUBLIC_USER_FIELDS
    );
    if (!updated) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar usuario.', detail: error };
  }
}

export async function setUserRole(actorId: string, id: string, role: unknown): Promise<StoreResponse> {
  try {
    if (!isUserRole(role)) {
      return { status: 400, message: { code: 'INVALID_ROLE', message: 'Rol inválido.' } };
    }
    if (actorId === id) {
      return { status: 400, message: { code: 'CANNOT_CHANGE_OWN_ROLE', message: 'No puedes cambiar tu propio rol.' } };
    }
    const target = await User.findById(id).select('role');
    if (!target) return { status: 404, message: 'Usuario no encontrado.' };

    // Siempre queda al menos un SUPER_ADMIN: quien hace el cambio lo es y no puede cambiar su propio rol.

    // Cambiar el rol cierra sus sesiones: vuelve a entrar con los permisos nuevos
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { role: [role], tokens: [] } },
      { new: true }
    ).select(PUBLIC_USER_FIELDS);
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al cambiar rol.', detail: error };
  }
}

export async function setUserActive(
  actor: { _id: string; role: string | string[] },
  id: string,
  active: boolean
): Promise<StoreResponse> {
  try {
    if (typeof active !== 'boolean') {
      return { status: 400, message: 'El campo active debe ser booleano.' };
    }
    if (!active && actor._id === id) {
      return { status: 400, message: 'No puedes desactivar tu propia cuenta.' };
    }
    const target = await loadManageableTarget(actor.role, id);
    if (target.error) return target.error;

    const update: { active: boolean; tokens?: [] } = { active };
    if (!active) update.tokens = []; // Revoca todas sus sesiones
    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select(
      PUBLIC_USER_FIELDS
    );
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar estado activo.', detail: error };
  }
}

export async function setUserPassword(
  actorRole: string | string[],
  id: string,
  password: string
): Promise<StoreResponse> {
  try {
    const target = await loadManageableTarget(actorRole, id);
    if (target.error) return target.error;
    const user = target.user;

    user.password = password;
    user.forcePasswordChangeOnNextLogin = true;
    user.tokens = [];
    await user.save();
    notifyPasswordChanged(recipientOf(user), 'admin');

    return { status: 200, message: { ok: true, message: 'Contraseña cambiada exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar contraseña.', detail: error };
  }
}

export async function setUserForcePasswordChange(
  actorRole: string | string[],
  id: string,
  force: boolean
): Promise<StoreResponse> {
  try {
    const target = await loadManageableTarget(actorRole, id);
    if (target.error) return target.error;
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { forcePasswordChangeOnNextLogin: force === true } },
      { new: true }
    ).select(PUBLIC_USER_FIELDS);
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al modificar requerimiento de clave.', detail: error };
  }
}

/** Campos que el usuario puede enviar al actualizar su perfil (pueden llegar con cualquier tipo) */
export interface ProfileUpdate {
  name?: unknown;
  lastName?: unknown;
  phone?: unknown;
  photo?: unknown;
  password?: unknown;
  nickname?: unknown;
  gender?: unknown;
  notifyEmail?: unknown;
  notifyComments?: unknown;
}

const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : value == null ? undefined : String(value).trim();

export async function updateProfile(userId: string, data: ProfileUpdate): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    if (data.name !== undefined) user.name = optionalText(data.name) ?? user.name;
    if (data.lastName !== undefined) user.lastName = optionalText(data.lastName);
    if (data.phone !== undefined) user.phone = optionalText(data.phone);
    if (data.nickname !== undefined) {
      const nick = optionalText(data.nickname);
      if (nick && nick.length > 30) return { status: 400, message: 'El apodo puede tener máximo 30 caracteres.' };
      user.nickname = nick || undefined;
    }
    if (data.gender !== undefined) {
      if (data.gender !== null && !['M', 'F', 'N'].includes(String(data.gender))) {
        return { status: 400, message: 'Género inválido (usa M, F o N).' };
      }
      user.gender = data.gender === null ? undefined : (String(data.gender) as 'M' | 'F' | 'N');
    }
    for (const key of ['notifyEmail', 'notifyComments'] as const) {
      if (data[key] === undefined) continue;
      if (typeof data[key] !== 'boolean') return { status: 400, message: `${key} debe ser true o false.` };
      user[key] = data[key] as boolean;
    }
    // La foto solo se cambia subiendo una imagen (POST /user/upload), nunca con una URL arbitraria

    // La contraseña NO se cambia por esta vía: usar /change-password (requiere la actual)
    if (data.password !== undefined) {
      return {
        status: 400,
        message: 'Para cambiar la contraseña usa el endpoint /user/change-password.',
      };
    }

    await user.save();
    const updated = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar el perfil.', detail: error };
  }
}

export async function uploadUserPhoto(userId: string, image?: UploadedImage): Promise<StoreResponse> {
  try {
    if (!image?.url) {
      return { status: 400, message: 'No se recibió ningún archivo de imagen.' };
    }
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    const previous = user.photo;
    user.photo = image.url;
    await user.save();
    // Se borra la anterior solo después de guardar la nueva
    if (previous) await deleteImage(previous);

    const updated = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al subir la imagen de perfil.', detail: error };
  }
}

/** Quita la foto de perfil (y la borra de Cloudinary si es nuestra) */
export async function removeUserPhoto(userId: string): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    const previous = user.photo;
    user.photo = undefined;
    await user.save();
    if (previous) await deleteImage(previous);

    const updated = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al quitar la imagen de perfil.', detail: error };
  }
}

