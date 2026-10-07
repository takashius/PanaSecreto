import { Server as SocketIOServer, Socket } from 'socket.io';
import { SendChatMessageSchema } from '@panasecreto/shared';

export function setupChatSockets(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

    // Unirse a la sala de un grupo
    socket.on('join_group_room', (groupId: string) => {
      socket.join(`group:${groupId}`);
      console.log(`[Socket.io] Cliente ${socket.id} se unió a la sala group:${groupId}`);
    });

    // Enviar mensaje de chat anónimo
    socket.on('send_anonymous_message', (payload: unknown) => {
      const parsed = SendChatMessageSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit('error', { message: 'Mensaje inválido', errors: parsed.error.flatten() });
      }

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        groupId: parsed.data.groupId,
        senderAlias: parsed.data.senderAlias || 'Tu Pana Secreto 🤫',
        content: parsed.data.content,
        isAnonymous: parsed.data.isAnonymous,
        createdAt: new Date().toISOString(),
      };

      // Emitir a todos los miembros de la sala del grupo
      io.to(`group:${parsed.data.groupId}`).emit('new_anonymous_message', messageData);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
    });
  });
}
