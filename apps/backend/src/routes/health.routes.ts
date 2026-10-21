import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const connected = mongoose.connection.readyState === 1;
  const dbStatus = connected ? 'connected' : 'disconnected';

  // 503 si la BD no está disponible: el healthcheck de Docker/Coolify lo detecta
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: '@panasecreto/backend',
    database: dbStatus,
    uptime: process.uptime(),
  });
});
