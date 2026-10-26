import React, { useState } from 'react';
import { Alert } from '../../components/common/AppDialog';
import { errorMessage } from '../../api/client';
import { useApiQuery, setQueryData } from '../../api/queryStore';
import { fetchMyGroups, MY_GROUPS_KEY } from '../../api/groups';
import { NOTIFICATIONS_UNREAD_KEY } from '../../api/badges';
import {
  NOTIFICATIONS_KEY,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api/notifications';
import NotificationsScreen from './NotificationsScreen';
import type { AppNotification } from '../../types/session';

/** Cambia la lista guardada y el contador de la campana a la vez (optimista) */
function patchList(update: (list: AppNotification[]) => AppNotification[]) {
  setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev) => {
    const next = update(prev ?? []);
    setQueryData<number>(NOTIFICATIONS_UNREAD_KEY, () => next.filter((n) => !n.read).length);
    return next;
  });
}

interface Props {
  /** Abre el destino de la notificación (deseo, sobre, grupo, chat, revelación) */
  onNavigate: (n: AppNotification) => void;
  onNavigateBack: () => void;
}

/** Notificaciones reales: lista, marcar leídas, borrar y deslizar para recargar */
export const NotificationsContainer: React.FC<Props> = ({ onNavigate, onNavigateBack }) => {
  const query = useApiQuery(NOTIFICATIONS_KEY, fetchNotifications, { staleMs: 15_000 });
  const groupsQuery = useApiQuery(MY_GROUPS_KEY, fetchMyGroups, { staleMs: 60_000 });
  const [refreshing, setRefreshing] = useState(false);

  const names = new Map((groupsQuery.data ?? []).map((g) => [g.id, `${g.emoji ?? ''} ${g.name}`.trim()]));
  const list = (query.data ?? []).map((n) => {
    const groupName = n.groupId ? names.get(n.groupId) : undefined;
    // Si el título ya es el nombre del grupo (avisos de «se unió»), no se repite abajo
    return { ...n, groupName: groupName && groupName !== n.title ? groupName : undefined };
  });

  const open = (n: AppNotification) => {
    if (!n.read) {
      patchList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      void markNotificationRead(n.id).catch(() => undefined);
    }
    // Avisos sin grupo (o de un grupo que ya no existe) solo se marcan leídos
    if (n.groupId) onNavigate(n);
  };

  const markAll = () => {
    patchList((l) => l.map((x) => ({ ...x, read: true })));
    markAllNotificationsRead().catch((e: unknown) => {
      Alert.alert('No pudimos marcarlas', errorMessage(e));
      void query.refetch();
    });
  };

  const remove = (n: AppNotification) =>
    Alert.alert('¿Borrar notificación?', n.title, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          patchList((l) => l.filter((x) => x.id !== n.id));
          deleteNotification(n.id).catch((e: unknown) => {
            Alert.alert('No pudimos borrarla', errorMessage(e));
            void query.refetch();
          });
        },
      },
    ]);

  const refresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };

  return (
    <NotificationsScreen
      notifications={list}
      onOpen={open}
      onMarkAllRead={markAll}
      onDelete={remove}
      onNavigateBack={onNavigateBack}
      loading={query.loading && !query.data}
      error={!query.data && query.error ? errorMessage(query.error) : null}
      onRetry={() => void query.refetch()}
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    />
  );
};

export default NotificationsContainer;
