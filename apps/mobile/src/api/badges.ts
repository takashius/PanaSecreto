import { api } from './client';

/** Contadores para la campana y la barra inferior */
export const NOTIFICATIONS_UNREAD_KEY = 'badges:notifications';
export const CHAT_UNREAD_KEY = 'badges:chat';

export const fetchNotificationsUnread = () =>
  api<{ unread: number }>('/api/notifications/unread-count').then((r) => r.unread);

export const fetchChatUnread = () => api<{ totalUnread: number }>('/api/chat').then((r) => r.totalUnread);
