import { Server as SocketIOServer, Socket } from 'socket.io';
import { SendGroupMessageSchema } from '@panasecreto/shared';
import * as chat from '../components/chat/store';

type Ack = (response: unknown) => void;
const safeAck = (ack: unknown): Ack => (typeof ack === 'function' ? (ack as Ack) : () => undefined);
const asGroupId = (payload: unknown) =>
  typeof payload === 'string' ? payload : String((payload as { groupId?: unknown } | null)?.groupId ?? '');

/**
 * Chat grupal anónimo en tiempo real.
 *
 * Eventos del cliente:
 *  - chat:join  { groupId }               → ack { ok, readOnly, myAlias, myAliasEmoji }
 *  - chat:leave { groupId }
 *  - chat:send  { groupId, text, kind }   → ack { ok, message } | { ok: false, code, message }
 *  - chat:read  { groupId }               → ack { ok }
 * Eventos del servidor:
 *  - chat:message GroupMessageView (sin datos del remitente; cada cliente reconoce los suyos por el alias o el id del ack)
 */
export function registerChatSockets(io: SocketIOServer): void {
  chat.setChatBroadcaster((groupId, message) => {
    io.to(chat.roomOf(groupId)).emit('chat:message', message);
  });

  io.on('connection', (socket: Socket) => {
    const userId = String(socket.data.userId);

    socket.on('chat:join', async (payload: unknown, ack?: unknown) => {
      const reply = safeAck(ack);
      try {
        const groupId = asGroupId(payload);
        const access = await chat.chatAccess(userId, groupId);
        if (!access) return reply({ ok: false, code: 'GROUP_NOT_FOUND', message: 'Grupo no encontrado.' });
        await socket.join(chat.roomOf(groupId));
        reply({ ok: true, readOnly: access.readOnly, myAlias: access.myAlias, myAliasEmoji: access.myAliasEmoji });
      } catch {
        reply({ ok: false, code: 'INTERNAL_ERROR', message: 'No se pudo entrar al chat.' });
      }
    });

    socket.on('chat:leave', async (payload: unknown, ack?: unknown) => {
      await socket.leave(chat.roomOf(asGroupId(payload)));
      safeAck(ack)({ ok: true });
    });

    socket.on('chat:send', async (payload: unknown, ack?: unknown) => {
      const reply = safeAck(ack);
      try {
        const groupId = asGroupId(payload);
        const { groupId: _ignored, ...body } = (payload ?? {}) as Record<string, unknown>;
        const parsed = SendGroupMessageSchema.safeParse(body);
        if (!parsed.success) {
          return reply({ ok: false, code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Mensaje inválido.' });
        }
        const result = await chat.sendMessage(userId, groupId, parsed.data);
        if (result.status >= 400) {
          const m = result.message as { code?: string; message?: string } | string;
          return reply({
            ok: false,
            code: typeof m === 'string' ? 'INTERNAL_ERROR' : m.code,
            message: typeof m === 'string' ? m : m.message,
          });
        }
        // Si no se había unido a la sala, entra ahora para recibir las respuestas
        await socket.join(chat.roomOf(groupId));
        reply({ ok: true, message: result.message });
      } catch {
        reply({ ok: false, code: 'INTERNAL_ERROR', message: 'No se pudo enviar el mensaje.' });
      }
    });

    socket.on('chat:read', async (payload: unknown, ack?: unknown) => {
      const result = await chat.markRead(userId, asGroupId(payload)).catch(() => ({ status: 500 }));
      safeAck(ack)({ ok: result.status < 400 });
    });
  });
}
