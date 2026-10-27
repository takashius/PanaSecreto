import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/common/AppDialog';
import { ApiError, errorMessage } from '../../api/client';
import { getQueryData, updateQueryData, useApiQuery } from '../../api/queryStore';
import {
  CHAT_LIST_KEY,
  addMessageToRoom,
  chatRoomKey,
  fetchChatHistory,
  fetchChatList,
  markChatReadRest,
  patchChatList,
  postChatMessage,
  toChatMessage,
  type ApiChatMessage,
  type ChatRoomState,
} from '../../api/chat';
import { joinChatRoom, markChatReadSocket, sendChatSocket } from '../../api/socket';
import { refreshChatList, useSocketStatus } from '../../hooks/useChatSync';
import ChatsScreen from './ChatsScreen';
import ChatRoomScreen, { type ClueAvailability } from './ChatRoomScreen';
import type { ChatPreviewData } from '../../components/chat/ChatTabPreview';
import type { DashboardTab } from '../../components/common/FloatingTabBar';
import type { ChatMessage } from '../../types/session';

/** Historial de una sala (se comparte entre la sala y la pestaña Chat del grupo) */
export function useChatRoom(groupId: string, staleMs = 0) {
  const fetcher = useCallback(() => fetchChatHistory(groupId), [groupId]);
  return useApiQuery(chatRoomKey(groupId), fetcher, { staleMs, enabled: !!groupId });
}

/** Resumen de la sala (nombre, estado, no leídos) desde la lista de chats */
function useChatSummary(groupId: string) {
  const list = useApiQuery(CHAT_LIST_KEY, fetchChatList, { staleMs: 30_000 });
  return { list, summary: list.data?.find((r) => r.groupId === groupId) ?? null };
}

/** Datos para la pestaña Chat del detalle del grupo */
export function useChatPreview(groupId: string): ChatPreviewData {
  const room = useChatRoom(groupId, 30_000);
  const { summary } = useChatSummary(groupId);
  return {
    myAlias: room.data?.myAlias ?? summary?.myAlias ?? null,
    unread: summary?.unread ?? 0,
    messages: room.data?.messages ?? [],
    loading: room.loading,
  };
}

/* ==================================================================== Lista */

interface ChatsProps {
  onOpenRoom: (groupId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onProfilePress: () => void;
  onOpenNotifications: () => void;
  hasNotifications?: boolean;
}

export const ChatsContainer: React.FC<ChatsProps> = (props) => {
  const list = useApiQuery(CHAT_LIST_KEY, fetchChatList, { staleMs: 15_000 });
  const [refreshing, setRefreshing] = useState(false);
  return (
    <ChatsScreen
      {...props}
      rooms={list.data ?? []}
      loading={list.loading}
      error={!list.data && list.error ? errorMessage(list.error) : null}
      onRetry={() => void list.refetch()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void refreshChatList()
          .catch(() => undefined)
          .finally(() => setRefreshing(false));
      }}
    />
  );
};

/* ==================================================================== Sala */

/** Rechazo del servidor al enviar por socket (mismo código que la API REST) */
class ChatSendError extends Error {
  code: string | undefined;
  constructor(code: string | undefined, message: string) {
    super(message);
    this.code = code;
  }
}

/** Error de envío con código del backend (por socket o REST) */
function sendError(e: unknown): { code?: string; message: string } {
  if (e instanceof ApiError) return { code: e.code, message: e.message };
  if (e instanceof ChatSendError) return { code: e.code, message: e.message };
  if (e instanceof Error && /timed out|timeout/i.test(e.message)) {
    return { message: 'El mensaje tardó demasiado. Revisa tu conexión e intenta de nuevo.' };
  }
  return { message: errorMessage(e) };
}

const SEND_ERROR_TITLE: Record<string, string> = {
  CHAT_RATE_LIMITED: 'Más despacio, pana 🐢',
  CHAT_READ_ONLY: 'Chat archivado',
  ALIAS_REQUIRED: 'Falta tu alias',
  CLUES_DISABLED: 'Pistas apagadas',
  NOT_DRAWN_YET: 'Todavía no hay sorteo',
};

interface RoomProps {
  groupId: string;
  onNavigateBack: () => void;
  /** Abre el grupo con la elección del alias */
  onChooseAlias: () => void;
}

export const ChatRoomContainer: React.FC<RoomProps> = ({ groupId, onNavigateBack, onChooseAlias }) => {
  const room = useChatRoom(groupId);
  const { summary } = useChatSummary(groupId);
  const socketStatus = useSocketStatus();
  const [loadingOlder, setLoadingOlder] = useState(false);
  const state = room.data;
  const loaded = state !== undefined;
  const messageCount = state?.messages.length ?? 0;

  // Entra a la sala (para recibir en vivo) apenas se abre
  useEffect(() => {
    void joinChatRoom(groupId);
  }, [groupId]);

  // Con la sala abierta todo queda leído (también cuando llegan mensajes nuevos)
  useEffect(() => {
    if (!loaded) return;
    if (!markChatReadSocket(groupId)) void markChatReadRest(groupId).catch(() => undefined);
    patchChatList(groupId, (r) => (r.unread ? { ...r, unread: 0 } : r));
  }, [groupId, messageCount, loaded]);

  const myAlias = state?.myAlias ?? summary?.myAlias ?? null;

  const send = async (text: string, kind: 'mensaje' | 'pista'): Promise<boolean> => {
    const tempId = `local-${Date.now()}`;
    const pending: ChatMessage = {
      id: tempId,
      alias: myAlias ?? '',
      avatar: state?.myAliasEmoji || '🎁',
      text,
      at: new Date().toISOString(),
      mine: true,
      kind,
      pending: true,
    };
    addMessageToRoom(groupId, pending);
    try {
      let sent: ApiChatMessage;
      try {
        const ack = await sendChatSocket(groupId, text, kind);
        if (!ack.ok) {
          throw new ChatSendError(ack.code, typeof ack.message === 'string' ? ack.message : 'No se pudo enviar el mensaje.');
        }
        sent = ack.message as ApiChatMessage;
      } catch (e) {
        // Sin conexión en vivo: se envía por la API normal (si el socket alcanzó a enviarlo, no se repite)
        if (e instanceof Error && e.message === 'SOCKET_OFFLINE') sent = await postChatMessage(groupId, text, kind);
        else throw e;
      }
      const message = { ...toChatMessage(sent, myAlias), mine: true };
      addMessageToRoom(groupId, message, tempId);
      patchChatList(groupId, (r) => ({ ...r, lastMessage: message }));
      return true;
    } catch (e) {
      const { code, message } = sendError(e);
      updateQueryData<ChatRoomState>(chatRoomKey(groupId), (prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== tempId),
        ...(code === 'CHAT_READ_ONLY' ? { readOnly: true } : {}),
        ...(code === 'ALIAS_REQUIRED' ? { myAlias: null } : {}),
      }));
      Alert.alert((code && SEND_ERROR_TITLE[code]) || 'No se envió el mensaje', message);
      return false;
    }
  };

  const loadOlder = async () => {
    const oldest = getQueryData<ChatRoomState>(chatRoomKey(groupId))?.messages.find((m) => !m.pending);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await fetchChatHistory(groupId, oldest.id);
      updateQueryData<ChatRoomState>(chatRoomKey(groupId), (prev) => {
        const known = new Set(prev.messages.map((m) => m.id));
        return { ...prev, hasMore: page.hasMore, messages: [...page.messages.filter((m) => !known.has(m.id)), ...prev.messages] };
      });
    } catch (e) {
      Alert.alert('No pudimos cargar los anteriores', errorMessage(e));
    } finally {
      setLoadingOlder(false);
    }
  };

  const status = summary?.status;
  const clues: ClueAvailability = !state?.cluesEnabled
    ? 'disabled'
    : status === 'LOCKED'
      ? 'enabled'
      : status === 'WAITING'
        ? 'notYet'
        : 'disabled';

  return (
    <ChatRoomScreen
      key={groupId}
      room={{
        groupId,
        name: summary?.name ?? 'Chat del grupo',
        emoji: summary?.emoji ?? '🎁',
        membersCount: summary?.membersCount ?? 0,
        exchangeAt: summary?.exchangeAt ?? new Date().toISOString(),
        myAlias,
      }}
      messages={state?.messages ?? []}
      loading={room.loading}
      error={room.error ? errorMessage(room.error) : null}
      onRetry={() => void room.refetch()}
      hasMore={state?.hasMore ?? false}
      loadingOlder={loadingOlder}
      onLoadOlder={() => void loadOlder()}
      readOnly={state?.readOnly ?? summary?.readOnly ?? false}
      clues={clues}
      online={socketStatus !== 'connecting'}
      onSend={send}
      onChooseAlias={onChooseAlias}
      onNavigateBack={onNavigateBack}
    />
  );
};
