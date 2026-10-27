import { io, type Socket } from 'socket.io-client';
import { API_URL } from './config';
import type { ApiChatMessage } from './chat';

/**
 * Conexión en tiempo real con la API (Socket.io, autenticada con el mismo JWT).
 * Una sola conexión para toda la app; se abre al iniciar sesión y se cierra al salir.
 * Al reconectarse vuelve a entrar a las salas de chat en las que estaba.
 */

export type SocketStatus = 'off' | 'connecting' | 'online';

export interface ChatAck {
  ok: boolean;
  code?: string;
  message?: unknown;
  readOnly?: boolean;
  myAlias?: string | null;
  myAliasEmoji?: string | null;
}

let socket: Socket | null = null;
let status: SocketStatus = 'off';
const rooms = new Set<string>();
const statusListeners = new Set<() => void>();
const messageListeners = new Set<(m: ApiChatMessage) => void>();

function setStatus(next: SocketStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((l) => l());
}

export const getSocketStatus = () => status;

export function subscribeSocketStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Escucha todos los mensajes nuevos de las salas en las que estoy */
export function onChatMessage(listener: (m: ApiChatMessage) => void) {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export function connectSocket(token: string) {
  if (socket) disconnectSocket();
  setStatus('connecting');
  const s = io(API_URL, {
    // React Native no tiene XHR long-polling confiable: solo WebSocket
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
  });
  s.on('connect', () => {
    setStatus('online');
    rooms.forEach((groupId) => s.emit('chat:join', { groupId }));
  });
  s.on('disconnect', () => setStatus(s.active ? 'connecting' : 'off'));
  s.on('connect_error', (err) => {
    // Sesión cerrada en otro lado: no tiene sentido seguir reintentando
    if (['TOKEN_MISSING', 'TOKEN_INVALID', 'SESSION_REVOKED'].includes(err.message)) {
      s.disconnect();
      setStatus('off');
    } else {
      setStatus('connecting');
    }
  });
  s.on('chat:message', (m: ApiChatMessage) => messageListeners.forEach((l) => l(m)));
  socket = s;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  rooms.clear();
  setStatus('off');
}

function emitWithAck(event: string, payload: unknown, timeoutMs = 8000): Promise<ChatAck> {
  const s = socket;
  if (!s || !s.connected) return Promise.reject(new Error('SOCKET_OFFLINE'));
  return s.timeout(timeoutMs).emitWithAck(event, payload) as Promise<ChatAck>;
}

/** Entra a la sala del grupo (y la recuerda para reconexiones) */
export function joinChatRoom(groupId: string): Promise<ChatAck | null> {
  if (rooms.has(groupId)) return Promise.resolve(null);
  rooms.add(groupId);
  if (!socket?.connected) return Promise.resolve(null);
  return emitWithAck('chat:join', { groupId }).catch(() => null);
}

export function isSocketOnline() {
  return !!socket?.connected;
}

/** Envía por socket; si no hay conexión, lanza SOCKET_OFFLINE para usar el respaldo REST */
export const sendChatSocket = (groupId: string, text: string, kind: 'mensaje' | 'pista') =>
  emitWithAck('chat:send', { groupId, text, kind });

export function markChatReadSocket(groupId: string) {
  if (socket?.connected) socket.emit('chat:read', { groupId });
  else return false;
  return true;
}
