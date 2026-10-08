import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'jsonwebtoken';
import config from './config/commons';
import { buildCorsOptions } from './config/cors';
import connectDb from './config/db';
import routes from './config/routes';
import { seedAppData } from './middleware/seed';
import { User } from './components/user/model';

const app: Express = express();

// Seguridad con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Body Parser nativo de Express
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS
const corsOptions = buildCorsOptions();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rutas de la aplicación
routes(app);

// Ruta raíz y salud
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'PanaSecreto API',
    version: '2.0.0',
    description: 'API base modular replicada desde arquitectura UniSan',
    status: 'online',
  });
});

app.get('/active-response', (_req: Request, res: Response) => {
  res.json({ active: true });
});

// Manejo de errores de parseo de JSON
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      message: 'Cuerpo de la petición JSON inválido.',
      detail: err.message,
    });
  }
  return next(err);
});

const httpServer = http.createServer(app);

// Configuración de WebSockets con autenticación JWT
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOptions.origin as any,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization ||
      '';
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

    (socket as any).userId = user._id.toString();
    (socket as any).role = user.role;
    next();
  } catch {
    next(new Error('TOKEN_INVALID'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Conexión establecida: ${socket.id} (Usuario: ${(socket as any).userId})`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Desconexión de socket: ${socket.id}`);
  });
});

async function init() {
  if (config.nodeEnv !== 'test') {
    await connectDb(config.dbUrl);
    await seedAppData();
  }

  httpServer.listen(config.port, () => {
    console.log(`🚀 PanaSecreto Backend activo en http://localhost:${config.port}`);
    console.log(`🔌 WebSockets activo y autenticado.`);
  });
}

init();

export { app, httpServer, io };
export default app;
