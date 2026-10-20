import { randomInt } from 'crypto';
import { User } from './model';
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
import { removeImage } from '../../middleware/saveFile';

const MAX_RECOVERY_ATTEMPTS = 5;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Carga el usuario objetivo y verifica que el actor tenga jerarquía para gestionarlo. */
async function loadManageableTarget(
  actorRole: string | string[],
  id: string
): Promise<{ user?: any; error?: StoreResponse }> {
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

const PUBLIC_USER_FIELDS = '-password -tokens -__v -recoveryCode -recoveryCodeExpires -recoveryAttempts';

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

    return {
      status: 200,
      message: {
        _id: user._id.toString(),
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        role: user.role,
        forcePasswordChangeOnNextLogin: user.forcePasswordChangeOnNextLogin,
        token,
      },
    };
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
}): Promise<StoreResponse> {
  try {
    const email = sanitizeEmail(data.email);
    const existing = await User.findOne({ email });
    if (existing) {
      return {
        status: 400,
        message: { email: 'Ya existe una cuenta registrada con este correo.' },
      };
    }

    const user = new User({
      name: data.name.trim(),
      lastName: data.lastName?.trim(),
      email,
      phone: data.phone?.trim(),
      password: data.password,
      role: [ROLES.USER],
      active: true,
    });

    await user.save();
    const token = await user.generateAuthToken();

    return {
      status: 201,
      message: {
        _id: user._id.toString(),
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token,
      },
    };
  } catch (error: any) {
    return {
      status: 400,
      message: error?.message || 'Error al registrar usuario.',
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
    if (!oldPass) {
      return { status: 400, message: 'La contraseña actual es requerida.' };
    }
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    const match = await compare(oldPass, user.password || '');
    if (!match) {
      return { status: 400, message: 'La contraseña actual no es correcta.' };
    }

    user.password = newPass;
    user.forcePasswordChangeOnNextLogin = false;
    // Cierra las demás sesiones; conserva solo la actual
    user.tokens = user.tokens.filter((t) => t.token === currentToken);
    await user.save();

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

    return { status: 200, message: { ok: true, message: 'Contraseña actualizada exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al cambiar contraseña.', detail: error };
  }
}

export async function recoveryStepOne(emailRaw: string): Promise<StoreResponse> {
  try {
    const email = sanitizeEmail(emailRaw);
    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad respondemos ok aunque no exista para no filtrar emails
      return { status: 200, message: { ok: true, message: 'Si el correo existe, recibirás un código.' } };
    }

    const code = randomInt(100000, 1000000);
    user.recoveryCode = code;
    user.recoveryCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    user.recoveryAttempts = 0;
    await user.save();

    // TODO: enviar el código por correo electrónico (servicio de email pendiente).
    if (config.dev) {
      console.log(`[AUTH RECOVERY][dev] Código para ${email}: ${code}`);
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
    user.recoveryCode = undefined;
    user.recoveryCodeExpires = undefined;
    user.recoveryAttempts = 0;
    user.tokens = []; // Cerrar todas las sesiones previas
    await user.save();

    return { status: 200, message: { ok: true, message: 'Contraseña restablecida exitosamente.' } };
  } catch (error) {
    return { status: 500, message: 'Error al restablecer contraseña.', detail: error };
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
    const query: any = {};

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

    const created = await User.findById(user._id).select(PUBLIC_USER_FIELDS);
    return { status: 201, message: created };
  } catch (error: any) {
    return { status: 400, message: error?.message || 'Error al crear usuario.', detail: error };
  }
}

export async function updateUserAdmin(
  actorRole: string | string[],
  id: string,
  payload: any
): Promise<StoreResponse> {
  try {
    const target = await loadManageableTarget(actorRole, id);
    if (target.error) return target.error;

    const allowed = ['name', 'lastName', 'middleName', 'phone', 'photo'];
    const update: any = {};
    for (const key of allowed) {
      if (payload?.[key] !== undefined) update[key] = String(payload[key]);
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

export async function setUserRole(id: string, role: string): Promise<StoreResponse> {
  try {
    if (!isUserRole(role)) {
      return { status: 400, message: 'Rol inválido.' };
    }
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { role: [role] } },
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

    const update: any = { active };
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

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    lastName?: string;
    phone?: string;
    photo?: string;
    password?: string;
  }
): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.lastName !== undefined) user.lastName = data.lastName.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.photo !== undefined) user.photo = data.photo;

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

export async function uploadUserPhoto(
  userId: string,
  file?: Express.Multer.File
): Promise<StoreResponse> {
  try {
    if (!file?.path) {
      return { status: 400, message: 'No se recibió ningún archivo de imagen.' };
    }
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    if (user.photo) {
      await removeImage(user.photo);
    }

    user.photo = file.path;
    await user.save();

    const updated = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al subir la imagen de perfil.', detail: error };
  }
}

