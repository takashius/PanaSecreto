import { Types, type FilterQuery } from 'mongoose';
import { Notification, INotification } from './model';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });

const view = (n: Pick<INotification, '_id' | 'kind' | 'target' | 'title' | 'body' | 'group' | 'wish' | 'readAt' | 'createdAt'>) => ({
  id: String(n._id),
  kind: n.kind,
  target: n.target,
  title: n.title,
  body: n.body,
  groupId: n.group ? String(n.group) : null,
  wishId: n.wish ? String(n.wish) : null,
  read: Boolean(n.readAt),
  createdAt: n.createdAt,
});

export async function listNotifications(userId: string, query: Record<string, unknown>): Promise<StoreResponse> {
  try {
    const user = new Types.ObjectId(userId);
    const filter: FilterQuery<INotification> = { user };
    if (query.unread === 'true') filter.readAt = null;
    if (typeof query.groupId === 'string' && Types.ObjectId.isValid(query.groupId)) {
      filter.group = new Types.ObjectId(query.groupId);
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 30));
    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user, readAt: null }),
    ]);
    return { status: 200, message: { results: items.map(view), total, unread, page, limit } };
  } catch (error) {
    return { status: 500, message: 'Error al consultar tus notificaciones.', detail: error };
  }
}

export async function unreadCount(userId: string): Promise<StoreResponse> {
  try {
    const unread = await Notification.countDocuments({ user: new Types.ObjectId(userId), readAt: null });
    return { status: 200, message: { unread } };
  } catch (error) {
    return { status: 500, message: 'Error al contar tus notificaciones.', detail: error };
  }
}

export async function markRead(userId: string, id: string): Promise<StoreResponse> {
  try {
    if (!Types.ObjectId.isValid(id)) return fail(404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada.');
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      [{ $set: { readAt: { $ifNull: ['$readAt', '$$NOW'] } } }],
      { new: true }
    ).lean();
    if (!n) return fail(404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada.');
    return { status: 200, message: view(n) };
  } catch (error) {
    return { status: 500, message: 'Error al marcar la notificación.', detail: error };
  }
}

export async function markAllRead(userId: string, groupId?: unknown): Promise<StoreResponse> {
  try {
    const filter: FilterQuery<INotification> = { user: new Types.ObjectId(userId), readAt: null };
    if (typeof groupId === 'string' && Types.ObjectId.isValid(groupId)) filter.group = new Types.ObjectId(groupId);
    const r = await Notification.updateMany(filter, { $set: { readAt: new Date() } });
    return { status: 200, message: { updated: r.modifiedCount } };
  } catch (error) {
    return { status: 500, message: 'Error al marcar las notificaciones.', detail: error };
  }
}

export async function deleteNotification(userId: string, id: string): Promise<StoreResponse> {
  try {
    if (!Types.ObjectId.isValid(id)) return fail(404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada.');
    const r = await Notification.deleteOne({ _id: id, user: new Types.ObjectId(userId) });
    if (r.deletedCount === 0) return fail(404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada.');
    return { status: 200, message: { ok: true } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar la notificación.', detail: error };
  }
}
