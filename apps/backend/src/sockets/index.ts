import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'jsonwebtoken';
import config from '../config/commons';
import { buildCorsOptions } from '../config/cors';
import { User } from '../components/user/model';
import { registerChatSockets } from './chat.socket';

/** Crea el servidor de WebSockets (autenticado con el mismo JWT de la API) y registra los módulos */
export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  const corsOptions = buildCorsOptions();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOptions.origin as string | boolean | string[] | undefined,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token || socket.handshake.headers.authorization || '';
      const token = String(raw).replace('Bearer ', '').trim();
      if (!token) return next(new Error('TOKEN_MISSING'));

      const data = verify(token, config.JWT_KEY) as { _id: string };
      const user = await User.findOne({
        _id: data._id,
        'tokens.token': token,
        $or: [{ active: true }, { active: { $exists: false } }],
      }).select('_id role');
      if (!user) return next(new Error('SESSION_REVOKED'));

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('TOKEN_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    // Sala personal (para avisos directos en el futuro)
    void socket.join(`user:${socket.data.userId}`);
  });

  registerChatSockets(io);
  return io;
}
