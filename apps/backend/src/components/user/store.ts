import { User } from './model';
import { canAccessWeb, ROLES, UserRole } from '../../config/roles';
import { sanitizeEmail } from '../../utils/sanitizeEmail';
import { StoreResponse } from '../../types/general';
import { compare } from 'bcryptjs';

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
    const user = await User.findById(userId).select('-password -tokens -__v');
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
  newPass: string
): Promise<StoreResponse> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }

    if (oldPass) {
      const match = await compare(oldPass, user.password || '');
      if (!match) {
        return { status: 400, message: 'La contraseña actual no es correcta.' };
      }
    }

    user.password = newPass;
    user.forcePasswordChangeOnNextLogin = false;
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

    const code = Math.floor(100000 + Math.random() * 900000);
    user.recoveryCode = code;
    user.recoveryCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await user.save();

    console.log(`[AUTH RECOVERY] Código para ${email}: ${code}`);
    return {
      status: 200,
      message: {
        ok: true,
        message: 'Código de recuperación generado.',
        devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
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
    const user = await User.findOne({
      email,
      recoveryCode: code,
      recoveryCodeExpires: { $gt: new Date() },
    });

    if (!user) {
      return { status: 400, message: 'El código de recuperación es inválido o ha expirado.' };
    }

    user.password = newPass;
    user.recoveryCode = undefined;
    user.recoveryCodeExpires = undefined;
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

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.q?.trim()) {
      const regex = new RegExp(filters.q.trim(), 'i');
      query.$or = [{ name: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      User.find(query)
        .select('-password -tokens -__v')
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
    const user = await User.findById(id).select('-password -tokens -__v');
    if (!user) {
      return { status: 404, message: 'Usuario no encontrado.' };
    }
    return { status: 200, message: user };
  } catch (error) {
    return { status: 500, message: 'Error al consultar usuario.', detail: error };
  }
}

export async function createUserAdmin(data: {
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
      role: [data.role || ROLES.USER],
      active: data.active !== false,
      forcePasswordChangeOnNextLogin: true,
    });

    await user.save();

    const created = await User.findById(user._id).select('-password -tokens -__v');
    return { status: 201, message: created };
  } catch (error: any) {
    return { status: 400, message: error?.message || 'Error al crear usuario.', detail: error };
  }
}

export async function updateUserAdmin(id: string, payload: any): Promise<StoreResponse> {
  try {
    const allowed = ['name', 'lastName', 'middleName', 'phone', 'photo'];
    const update: any = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) update[key] = payload[key];
    }

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select(
      '-password -tokens -__v'
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
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { role: [role] } },
      { new: true }
    ).select('-password -tokens -__v');
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al cambiar rol.', detail: error };
  }
}

export async function setUserActive(id: string, active: boolean): Promise<StoreResponse> {
  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true }
    ).select('-password -tokens -__v');
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar estado activo.', detail: error };
  }
}

export async function setUserPassword(id: string, password: string): Promise<StoreResponse> {
  try {
    const user = await User.findById(id);
    if (!user) return { status: 404, message: 'Usuario no encontrado.' };

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
  id: string,
  force: boolean
): Promise<StoreResponse> {
  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { forcePasswordChangeOnNextLogin: force } },
      { new: true }
    ).select('-password -tokens -__v');
    if (!updated) return { status: 404, message: 'Usuario no encontrado.' };
    return { status: 200, message: updated };
  } catch (error) {
    return { status: 500, message: 'Error al modificar requerimiento de clave.', detail: error };
  }
}
