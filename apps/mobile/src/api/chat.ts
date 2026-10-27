import { api } from './client';
import { setQueryData, updateQueryData } from './queryStore';
import { CHAT_UNREAD_KEY } from './badges';
import type { ChatMessage, ChatRoomSummary, GroupStatus } from '../types/session';

/** Mensaje tal como lo manda la API (REST y socket): nunca trae el usuario real */
export interface ApiChatMessage {
  id: string;
  groupId: string;
  alias: string;
  aliasEmoji: string;
  text: string;
  kind: 'mensaje' | 'pista';
  /** Solo en el historial propio y en la respuesta a quien lo envió */
  mine?: boolean;
  createdAt: string;
}

interface ApiChatRoom {
  groupId: string;
  name: string;
  emoji?: string;
  status: GroupStatus;
  exchangeDate: string;
  memberCount: number;
  readOnly: boolean;
  myAlias: string | null;
  myAliasEmoji: string | null;
  unread: number;
  lastMessage: ApiChatMessage | null;
}

/** Estado de una sala: mensajes cargados (del más viejo al más nuevo) y permisos */
export interface ChatRoomState {
  messages: ChatMessage[];
  hasMore: boolean;
  readOnly: boolean;
  myAlias: string | null;
  myAliasEmoji: string | null;
  cluesEnabled: boolean;
}

export const CHAT_LIST_KEY = 'chat:list';
export const chatRoomKey = (groupId: string) => `chat:room:${groupId}`;

/** `mine` llega en el historial; en los mensajes en vivo se reconoce por el alias (único en el grupo) */
export const toChatMessage = (m: ApiChatMessage, myAlias?: string | null): ChatMessage => ({
  id: m.id,
  alias: m.alias,
  avatar: m.aliasEmoji || '🎁',
  text: m.text,
  at: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
  mine: m.mine ?? (!!myAlias && m.alias === myAlias),
  kind: m.kind,
});

const toRoom = (r: ApiChatRoom): ChatRoomSummary => ({
  groupId: r.groupId,
  emoji: r.emoji || '🎁',
  name: r.name,
  status: r.status,
  myAlias: r.myAlias,
  myAvatar: r.myAliasEmoji || '🎁',
  membersCount: r.memberCount,
  exchangeAt: r.exchangeDate,
  unread: r.unread,
  readOnly: r.readOnly,
  lastMessage: r.lastMessage ? toChatMessage(r.lastMessage, r.myAlias) : null,
});

/** Lista de chats (también actualiza el contador de la barra inferior) */
export async function fetchChatList(): Promise<ChatRoomSummary[]> {
  const r = await api<{ results: ApiChatRoom[]; totalUnread: number }>('/api/chat');
  setQueryData<number>(CHAT_UNREAD_KEY, () => r.totalUnread);
  return r.results.map(toRoom);
}

/** Historial: los últimos 50, o los anteriores a `before` (id del mensaje más viejo cargado) */
export async function fetchChatHistory(groupId: string, before?: string): Promise<ChatRoomState> {
  const params = new URLSearchParams({ limit: '50' });
  if (before) params.set('before', before);
  const r = await api<{
    results: ApiChatMessage[];
    hasMore: boolean;
    readOnly: boolean;
    myAlias: string | null;
    myAliasEmoji: string | null;
    cluesEnabled: boolean;
  }>(`/api/group/${groupId}/chat?${params.toString()}`);
  return {
    messages: r.results.map((m) => toChatMessage(m, r.myAlias)),
    hasMore: r.hasMore,
    readOnly: r.readOnly,
    myAlias: r.myAlias,
    myAliasEmoji: r.myAliasEmoji,
    cluesEnabled: r.cluesEnabled,
  };
}

/** Respaldo por REST cuando el socket no está conectado */
export const postChatMessage = (groupId: string, text: string, kind: 'mensaje' | 'pista') =>
  api<ApiChatMessage>(`/api/group/${groupId}/chat`, { method: 'POST', body: { text, kind } });

export const markChatReadRest = (groupId: string) => api<{ ok: boolean }>(`/api/group/${groupId}/chat/read`, { method: 'POST' });

/* ------------------------------------------------ Actualizaciones locales de la caché */

/** Cambia una sala de la lista y recalcula el total de no leídos */
export function patchChatList(groupId: string, update: (room: ChatRoomSummary) => ChatRoomSummary) {
  updateQueryData<ChatRoomSummary[]>(CHAT_LIST_KEY, (prev) => {
    const next = prev.map((r) => (r.groupId === groupId ? update(r) : r));
    // La sala con el mensaje más reciente sube
    next.sort((a, b) => (b.lastMessage?.at ?? '').localeCompare(a.lastMessage?.at ?? ''));
    setQueryData<number>(CHAT_UNREAD_KEY, () => next.reduce((n, r) => n + r.unread, 0));
    return next;
  });
}

/** Agrega un mensaje a la sala cargada (sin duplicar) y, si viene `replaceId`, reemplaza el pendiente */
export function addMessageToRoom(groupId: string, message: ChatMessage, replaceId?: string) {
  updateQueryData<ChatRoomState>(chatRoomKey(groupId), (prev) => {
    const withoutPending = replaceId ? prev.messages.filter((m) => m.id !== replaceId) : prev.messages;
    if (withoutPending.some((m) => m.id === message.id)) return { ...prev, messages: withoutPending };
    return { ...prev, messages: [...withoutPending, message] };
  });
}
