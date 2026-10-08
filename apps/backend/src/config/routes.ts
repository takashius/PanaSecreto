import { Express } from 'express';
import userRouter from '../components/user/network';
import configRouter from '../components/config/network';
import { healthRouter } from '../routes/health.routes';

export default function registerRoutes(app: Express) {
  // Estado y chequeo de salud
  app.use('/api', healthRouter);

  // Módulo de Usuarios y Autenticación
  app.use('/user', userRouter);
  app.use('/api/user', userRouter);

  // Módulo de Configuración del Sistema
  app.use('/config', configRouter);
  app.use('/api/config', configRouter);
}
