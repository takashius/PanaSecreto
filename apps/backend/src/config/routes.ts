import { Express } from 'express';
import userRouter from '../components/user/network';
import { healthRouter } from '../routes/health.routes';

export default function registerRoutes(app: Express) {
  // Estado y chequeo de salud
  app.use('/api', healthRouter);

  // Módulo de Usuarios y Autenticación
  app.use('/user', userRouter);
  app.use('/api/user', userRouter);
}
