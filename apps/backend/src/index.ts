import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'jsonwebtoken';
import config from './config/commons';
import { buildCorsOptions } from './config/cors';
import connectDb from './config/db';
import { migrateBrandName, seedAppData } from './middleware/seed';
import { User } from './components/user/model';
import { createApp } from './app';
import { flushNotifications } from './services/notifications';
import mongoose from 'mongoose';

const app = createApp();
const httpServer = http.createServer(app);

// Configuración de WebSockets con autenticación JWT
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
    if (!token) {
      return next(new Error('TOKEN_MISSING'));
    }

    const data = verify(token, config.JWT_KEY) as { _id: string };
    const user = await User.findOne({
      _id: data._id,
      'tokens.token': token,
      $or: [{ active: true }, { active: { $exists: false } }],
    }).select('_id role');

    if (!user) {
      return next(new Error('SESSION_REVOKED'));
    }

    socket.data.userId = user._id.toString();
    socket.data.role = user.role;
    next();
  } catch {
    next(new Error('TOKEN_INVALID'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Conexión establecida: ${socket.id} (Usuario: ${socket.data.userId})`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Desconexión de socket: ${socket.id}`);
  });
});

async function init() {
  try {
    await connectDb(config.dbUrl);
  } catch (err) {
    console.error('[db] No se pudo conectar a MongoDB. El servidor no arrancará.', (err as Error).message);
    process.exit(1);
  }
  await seedAppData();
  await migrateBrandName();

  httpServer.listen(config.port, () => {
    console.log(`🚀 EntrePanas Backend activo en http://localhost:${config.port}`);
    console.log(`🔌 WebSockets activo y autenticado.`);
  });
}

init();

// Apagado ordenado (redespliegues de Coolify/Docker): termina los correos en curso antes de salir
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} recibido: cerrando…`);
  httpServer.close();
  io.close();
  await Promise.race([flushNotifications(), new Promise((r) => setTimeout(r, 10000))]);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app, httpServer, io };
export default app;
