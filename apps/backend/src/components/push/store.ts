import { Types } from 'mongoose';
import { PushToken } from './model';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });

/** ExponentPushToken[xxxxxxxx] (formato de Expo) */
export const isExpoPushToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 200 && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(value.trim());

/** Registra (o renueva) el token del teléfono para este usuario */
export async function registerToken(userId: string, body: Record<string, unknown> = {}): Promise<StoreResponse> {
  try {
    if (!isExpoPushToken(body.token)) return fail(400, 'INVALID_PUSH_TOKEN', 'El token de notificaciones no es válido.');
    const platform = body.platform === 'android' || body.platform === 'ios' ? body.platform : undefined;
    const deviceName = typeof body.deviceName === 'string' ? body.deviceName.trim().slice(0, 80) || undefined : undefined;
    await PushToken.findOneAndUpdate(
      { token: body.token.trim() },
      { $set: { user: new Types.ObjectId(userId), platform, deviceName, lastSeenAt: new Date() } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    return { status: 200, message: { ok: true } };
  } catch (error) {
    return { status: 500, message: 'Error al registrar el teléfono para notificaciones.', detail: error };
  }
}

/** Quita el token (al cerrar sesión o al apagar las push en el teléfono) */
export async function removeToken(userId: string, body: Record<string, unknown> = {}): Promise<StoreResponse> {
  try {
    if (!isExpoPushToken(body.token)) return fail(400, 'INVALID_PUSH_TOKEN', 'El token de notificaciones no es válido.');
    await PushToken.deleteOne({ token: body.token.trim(), user: new Types.ObjectId(userId) });
    return { status: 200, message: { ok: true } };
  } catch (error) {
    return { status: 500, message: 'Error al quitar el teléfono de las notificaciones.', detail: error };
  }
}
