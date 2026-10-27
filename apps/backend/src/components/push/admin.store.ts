import { Types } from 'mongoose';
import { PushToken } from './model';
import { PushCampaign, type IPushCampaign, type PushAudience } from './campaign.model';
import { Group } from '../group/model';
import { User } from '../user/model';
import { insertInAppDocs } from '../../services/notifications';
import { pushForNotifications, pushToUsers } from '../../services/push';
import { StoreResponse } from '../../types/general';

/**
 * Avisos push desde el panel: a todos, a los miembros de un grupo o a usuarios elegidos.
 * Solo llegan a quien tiene la cuenta activa, las push encendidas y al menos un teléfono registrado.
 */

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });

export const TITLE_MAX = 80;
export const BODY_MAX = 240;
const MAX_USERS = 500;

interface AudienceInput {
  audience?: unknown;
  groupId?: unknown;
  userIds?: unknown;
}

interface Audience {
  audience: PushAudience;
  /** Usuarios elegidos (activos) */
  selectedIds: Types.ObjectId[];
  group?: { id: Types.ObjectId; name: string };
}

const toIds = (raw: unknown): Types.ObjectId[] => {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' && raw ? raw.split(',') : [];
  const unique = [...new Set(list.map((x) => String(x).trim()))].filter((x) => Types.ObjectId.isValid(x));
  return unique.slice(0, MAX_USERS).map((x) => new Types.ObjectId(x));
};

async function resolveAudience(input: AudienceInput): Promise<Audience | StoreResponse> {
  const audience = input.audience;
  if (audience === 'all') {
    const selectedIds = (await User.find({ active: { $ne: false } }).select('_id').lean()).map((u) => u._id);
    return { audience, selectedIds };
  }
  if (audience === 'group') {
    if (typeof input.groupId !== 'string' || !Types.ObjectId.isValid(input.groupId)) {
      return fail(400, 'GROUP_REQUIRED', 'Elige el grupo que recibirá el aviso.');
    }
    const group = await Group.findById(input.groupId).select('name emoji members.user').lean();
    if (!group) return fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
    const memberIds = group.members.map((m) => m.user as Types.ObjectId);
    const active = await User.find({ _id: { $in: memberIds }, active: { $ne: false } }).select('_id').lean();
    return {
      audience,
      selectedIds: active.map((u) => u._id),
      group: { id: group._id, name: `${group.emoji ? `${group.emoji} ` : ''}${group.name}` },
    };
  }
  if (audience === 'users') {
    const ids = toIds(input.userIds);
    if (ids.length === 0) return fail(400, 'USERS_REQUIRED', 'Elige al menos un usuario.');
    const active = await User.find({ _id: { $in: ids }, active: { $ne: false } }).select('_id').lean();
    return { audience, selectedIds: active.map((u) => u._id) };
  }
  return fail(400, 'INVALID_AUDIENCE', 'Destinatarios inválidos (usa all, group o users).');
}

/** Cuántos lo recibirían: elegidos, con teléfono, con push apagadas y teléfonos */
async function measure(selectedIds: Types.ObjectId[]) {
  const withDevice = (await PushToken.distinct('user', { user: { $in: selectedIds } })) as Types.ObjectId[];
  const reachableUsers = await User.find({ _id: { $in: withDevice }, notifyPush: { $ne: false } }).select('_id').lean();
  const reachableIds = reachableUsers.map((u) => u._id);
  const devices = await PushToken.countDocuments({ user: { $in: reachableIds } });
  return {
    selected: selectedIds.length,
    withDevice: withDevice.length,
    reachable: reachableIds.length,
    optedOut: withDevice.length - reachableIds.length,
    devices,
    reachableIds,
  };
}

const isError = (x: Audience | StoreResponse): x is StoreResponse => 'status' in x;

/** Vista previa de destinatarios (no envía nada) */
export async function previewAudience(query: AudienceInput): Promise<StoreResponse> {
  try {
    const audience = await resolveAudience(query);
    if (isError(audience)) return audience;
    const { reachableIds: _ids, ...counts } = await measure(audience.selectedIds);
    return { status: 200, message: { ...counts, groupName: audience.group?.name ?? null } };
  } catch (error) {
    return { status: 500, message: 'Error al calcular los destinatarios.', detail: error };
  }
}

/** Resumen general: teléfonos registrados y usuarios que pueden recibir push */
export async function pushStats(): Promise<StoreResponse> {
  try {
    const [devices, android, ios, usersWithDevice] = await Promise.all([
      PushToken.countDocuments(),
      PushToken.countDocuments({ platform: 'android' }),
      PushToken.countDocuments({ platform: 'ios' }),
      PushToken.distinct('user'),
    ]);
    const reachable = await User.countDocuments({ _id: { $in: usersWithDevice }, active: { $ne: false }, notifyPush: { $ne: false } });
    return { status: 200, message: { devices, android, ios, usersWithDevice: usersWithDevice.length, reachable } };
  } catch (error) {
    return { status: 500, message: 'Error al consultar las estadísticas de push.', detail: error };
  }
}

const campaignView = (c: IPushCampaign | (Omit<IPushCampaign, 'users'> & { users: unknown[] })) => ({
  id: String(c._id),
  title: c.title,
  body: c.body,
  audience: c.audience,
  groupId: c.group ? String(c.group) : null,
  groupName: c.groupName ?? null,
  users: (c.users as Array<{ _id?: Types.ObjectId; name?: string; lastName?: string; email?: string } | Types.ObjectId>).map((u) =>
    u && typeof u === 'object' && 'email' in u
      ? { id: String(u._id), name: [u.name, u.lastName].filter(Boolean).join(' '), email: u.email }
      : { id: String(u), name: '', email: '' }
  ),
  inApp: c.inApp,
  sentByName: c.sentByName ?? null,
  selected: c.selected,
  reachable: c.reachable,
  devices: c.devices,
  sent: c.sent,
  createdAt: c.createdAt,
});

/** Envía el aviso y lo guarda en el historial */
export async function sendCampaign(adminId: string, body: Record<string, unknown> = {}): Promise<StoreResponse> {
  try {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title) return fail(400, 'TITLE_REQUIRED', 'Escribe el título del aviso.');
    if (title.length > TITLE_MAX) return fail(400, 'TITLE_TOO_LONG', `El título puede tener máximo ${TITLE_MAX} caracteres.`);
    if (!text) return fail(400, 'BODY_REQUIRED', 'Escribe el mensaje del aviso.');
    if (text.length > BODY_MAX) return fail(400, 'BODY_TOO_LONG', `El mensaje puede tener máximo ${BODY_MAX} caracteres.`);
    const inApp = body.inApp === true;

    const audience = await resolveAudience(body);
    if (isError(audience)) return audience;
    const counts = await measure(audience.selectedIds);
    if (counts.reachable === 0 && !inApp) {
      return fail(409, 'NO_RECIPIENTS', 'Ninguno de los destinatarios tiene la app instalada con las notificaciones push activas.');
    }

    const groupId = audience.group ? String(audience.group.id) : undefined;
    let sent: number;
    if (inApp) {
      // Queda en la campana de todos los elegidos; la push sale a los que tienen teléfono
      const docs = await insertInAppDocs(
        audience.selectedIds.map((id) => ({
          userId: String(id),
          kind: 'announcement' as const,
          target: 'group' as const,
          groupId,
          title,
          body: text,
        })),
        { push: false }
      );
      sent = await pushForNotifications(docs);
    } else {
      ({ sent } = await pushToUsers(counts.reachableIds, {
        title,
        body: text,
        data: groupId ? { target: 'group', groupId } : {},
      }));
    }

    const admin = await User.findById(adminId).select('name lastName').lean();
    const campaign = await PushCampaign.create({
      title,
      body: text,
      audience: audience.audience,
      group: audience.group?.id,
      groupName: audience.group?.name,
      users: audience.audience === 'users' ? audience.selectedIds : [],
      inApp,
      sentBy: new Types.ObjectId(adminId),
      sentByName: admin ? [admin.name, admin.lastName].filter(Boolean).join(' ') : undefined,
      selected: counts.selected,
      reachable: counts.reachable,
      devices: counts.devices,
      sent,
    });
    return { status: 201, message: campaignView(campaign) };
  } catch (error) {
    return { status: 500, message: 'Error al enviar el aviso.', detail: error };
  }
}

/** Historial de avisos enviados */
export async function listCampaigns(query: { page?: unknown; limit?: unknown }): Promise<StoreResponse> {
  try {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const [items, total] = await Promise.all([
      PushCampaign.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'users', select: 'name lastName email', options: { limit: 20 } })
        .lean(),
      PushCampaign.countDocuments(),
    ]);
    return {
      status: 200,
      message: { results: items.map((c) => campaignView(c as never)), total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar el historial de avisos.', detail: error };
  }
}
