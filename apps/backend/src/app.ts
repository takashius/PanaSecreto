import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { buildCorsOptions } from './config/cors';
import routes from './config/routes';

/**
 * Construye la aplicación Express (sin abrir puertos ni conectar a la BD).
 * Separado de index.ts para poder probarla con tests automatizados.
 */
export function createApp(): Express {
  const app: Express = express();

  // Detrás de un proxy (Coolify/Traefik/Nginx) para que rate limit vea la IP real
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  const corsOptions = buildCorsOptions();
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  routes(app);

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'EntrePanas API',
      version: '2.0.0',
      status: 'online',
    });
  });

  app.get('/active-response', (_req: Request, res: Response) => {
    res.json({ active: true });
  });

  // 404 en JSON para rutas inexistentes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Ruta no encontrada.' });
  });

  // Manejador final de errores
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ code: 'INVALID_JSON', message: 'Cuerpo de la petición JSON inválido.' });
      return;
    }
    if ((err as { type?: string } | null)?.type === 'entity.too.large') {
      res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', message: 'La petición es demasiado grande.' });
      return;
    }
    console.error(`[${req.method} ${req.originalUrl}] Error no controlado:`, err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error en el servidor.' });
  });

  return app;
}
