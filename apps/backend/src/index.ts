import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { groupRouter } from './routes/group.routes';
import { setupChatSockets } from './sockets/chat.socket';

const app: Express = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api/groups', groupRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'PanaSecreto API',
    version: '1.0.0',
    description: 'Servicio REST y WebSockets para PanaSecreto',
    docs: '/api/health',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error no controlado]', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// Initialize WebSockets
setupChatSockets(io);

// Connect to Database & Start Server
async function startServer() {
  try {
    if (config.mongoUri) {
      console.log('[Database] Conectando a MongoDB...');
      await mongoose.connect(config.mongoUri);
      console.log('[Database] MongoDB conectado exitosamente');
    }
  } catch (error) {
    console.warn('[Database] Advertencia: No se pudo conectar a MongoDB. Continuando en modo degradado:', (error as Error).message);
  }

  server.listen(config.port, () => {
    console.log(`🚀 PanaSecreto Backend escuchando en http://localhost:${config.port}`);
    console.log(`🔌 WebSockets activo en puerto ${config.port}`);
  });
}

startServer();
