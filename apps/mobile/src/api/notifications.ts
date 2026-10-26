import { api } from './client';
import type { AppNotification, NotificationKind } from '../types/session';

type Target = AppNotification['target']['screen'];

/** Notificación tal como la devuelve GET /api/notifications */
export interface ApiNotification {
  id: string;
  kind: NotificationKind;
  target: Target;
  title: string;
  body: string;
  groupId: string | null;
  wishId: string | null;
  read: boolean;
  createdAt: string;
}

export const NOTIFICATIONS_KEY = 'notifications:list';

export const toAppNotification = (n: ApiNotification): AppNotification => ({
  id: n.id,
  kind: n.kind,
  title: n.title,
  text: n.body,
  groupId: n.groupId,
  at: n.createdAt,
  read: n.read,
  target: { screen: n.target, wishId: n.wishId ?? undefined },
});

/** Las últimas 100 (se borran solas a los 90 días) */
export const fetchNotifications = () =>
  api<{ results: ApiNotification[]; unread: number }>('/api/notifications?limit=100').then((r) => r.results.map(toAppNotification));

export const markNotificationRead = (id: string) => api<ApiNotification>(`/api/notifications/${id}/read`, { method: 'POST' });

export const markAllNotificationsRead = () => api<{ updated: number }>('/api/notifications/read-all', { method: 'POST' });

export const deleteNotification = (id: string) => api<{ ok: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' });
