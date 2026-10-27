import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { getAuthToken } from '../api/client';
import { fetchQuery, getQueryData } from '../api/queryStore';
import {
  CHAT_LIST_KEY,
  addMessageToRoom,
  chatRoomKey,
  fetchChatList,
  patchChatList,
  toChatMessage,
  type ChatRoomState,
} from '../api/chat';
import {
  connectSocket,
  disconnectSocket,
  getSocketStatus,
  joinChatRoom,
  markChatReadSocket,
  onChatMessage,
  subscribeSocketStatus,
} from '../api/socket';
import type { ChatRoomSummary } from '../types/session';

/** Carga la lista de chats y entra a todas las salas para recibir mensajes en vivo */
export async function refreshChatList(): Promise<void> {
  await fetchQuery(CHAT_LIST_KEY, fetchChatList);
  getQueryData<ChatRoomSummary[]>(CHAT_LIST_KEY)?.forEach((r) => void joinChatRoom(r.groupId));
}

/** Estado de la conexión en tiempo real (para el aviso «Reconectando…») */
export const useSocketStatus = () => useSyncExternalStore(subscribeSocketStatus, getSocketStatus);

/**
 * Chat en tiempo real mientras hay sesión:
 * - abre el socket con el token de la sesión y entra a las salas de mis grupos;
 * - cada mensaje nuevo actualiza la sala (si está cargada), la lista y los no leídos;
 * - si la sala está abierta en pantalla, el mensaje se marca leído al instante.
 * `openRoomId` = sala que se está viendo ahora (o null).
 */
export function useChatSync(signedIn: boolean, openRoomId: string | null) {
  const openRef = useRef(openRoomId);
  useEffect(() => {
    openRef.current = openRoomId;
  }, [openRoomId]);

  useEffect(() => {
    if (!signedIn) return;
    const token = getAuthToken();
    if (token) connectSocket(token);
    void refreshChatList().catch(() => undefined);

    const offMessage = onChatMessage((raw) => {
      const groupId = raw.groupId;
      const room = getQueryData<ChatRoomState>(chatRoomKey(groupId));
      const summary = getQueryData<ChatRoomSummary[]>(CHAT_LIST_KEY)?.find((r) => r.groupId === groupId);
      const myAlias = room?.myAlias ?? summary?.myAlias ?? null;
      const message = toChatMessage(raw, myAlias);
      const viewing = openRef.current === groupId;

      addMessageToRoom(groupId, message);
      if (!summary) {
        // Grupo nuevo que aún no está en la lista
        void refreshChatList().catch(() => undefined);
        return;
      }
      patchChatList(groupId, (r) => ({
        ...r,
        lastMessage: message,
        unread: viewing ? 0 : message.mine ? r.unread : r.unread + 1,
      }));
      if (viewing && !message.mine) markChatReadSocket(groupId);
    });

    // Al volver a la app: la lista se pone al día (el socket se reconecta solo)
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshChatList().catch(() => undefined);
    });

    return () => {
      offMessage();
      appState.remove();
      disconnectSocket();
    };
  }, [signedIn]);
}
