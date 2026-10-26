import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { fetchQuery, hasQuery, setQueryData } from '../api/queryStore';
import { NOTIFICATIONS_UNREAD_KEY, fetchNotificationsUnread } from '../api/badges';
import { NOTIFICATIONS_KEY, fetchNotifications, markNotificationRead } from '../api/notifications';
import { registerForPush, setAppBadge, subscribeToPush, type PushData } from '../notifications/push';
import type { AppNotification } from '../types/session';

const POLL_MS = 60_000;

/** Recarga la campana (y la lista si alguna pantalla la está usando) y ajusta el número del ícono */
export async function refreshNotifications(): Promise<void> {
  await Promise.all([
    fetchQuery(NOTIFICATIONS_UNREAD_KEY, fetchNotificationsUnread),
    hasQuery(NOTIFICATIONS_KEY) ? fetchQuery(NOTIFICATIONS_KEY, fetchNotifications) : Promise.resolve(),
  ]);
}

type OpenTarget = Pick<AppNotification, 'groupId' | 'target'>;

/**
 * Mantiene las notificaciones al día mientras hay sesión:
 * - consulta cada minuto con la app en primer plano y al volver a ella;
 * - registra el teléfono para push (en un build propio) y recarga al recibir una;
 * - al tocar una push, la marca leída y abre su destino.
 */
export function useNotificationSync(signedIn: boolean, unread: number | undefined, onOpen: (n: OpenTarget) => void) {
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);

  // Número del ícono de la app = no leídas
  useEffect(() => {
    if (signedIn && unread !== undefined) void setAppBadge(unread);
  }, [signedIn, unread]);

  useEffect(() => {
    if (!signedIn) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refreshNotifications();
    }, POLL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotifications();
    });

    void registerForPush().catch((error: unknown) => console.warn('[push] No se pudo registrar el teléfono:', error));
    const unsubscribe = subscribeToPush({
      onReceive: () => void refreshNotifications(),
      onTap: (data: PushData) => {
        if (data.notificationId) {
          const id = data.notificationId;
          if (hasQuery(NOTIFICATIONS_KEY)) {
            setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)));
          }
          void markNotificationRead(id)
            .catch(() => undefined)
            .finally(() => void refreshNotifications());
        }
        if (data.groupId && data.target) {
          openRef.current({ groupId: data.groupId, target: { screen: data.target, wishId: data.wishId ?? undefined } });
        }
      },
    });

    return () => {
      clearInterval(timer);
      appState.remove();
      unsubscribe();
    };
  }, [signedIn]);
}
