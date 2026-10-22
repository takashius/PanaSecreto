import http from 'http';
import config from './config/commons';
import connectDb from './config/db';
import { migrateBrandName, seedAppData } from './middleware/seed';
import { createSocketServer } from './sockets';
import { scheduleReminders } from './services/reminders';
import { createApp } from './app';
import { flushNotifications } from './services/notifications';
import mongoose from 'mongoose';

const app = createApp();
const httpServer = http.createServer(app);

// WebSockets autenticados con el mismo JWT de la API (chat grupal en tiempo real)
const io = createSocketServer(httpServer);
let stopReminders: (() => void) | null = null;

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
  stopReminders = scheduleReminders();
}

init();

// Apagado ordenado (redespliegues de Coolify/Docker): termina los correos en curso antes de salir
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} recibido: cerrando…`);
  stopReminders?.();
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
