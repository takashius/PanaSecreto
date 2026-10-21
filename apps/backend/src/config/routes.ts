import { Express } from 'express';
import userRouter from '../components/user/network';
import configRouter from '../components/config/network';
import groupRouter from '../components/group/network';
import wishlistRouter from '../components/wishlist/network';
import statsRouter from '../components/stats/network';
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

  // Estadísticas para el dashboard administrativo
  app.use('/api/stats', statsRouter);

  // Módulo de Grupos de Amigo Secreto (sorteo, invitaciones, asignaciones)
  app.use('/group/:id/wishlist', wishlistRouter);
  app.use('/api/group/:id/wishlist', wishlistRouter);
  app.use('/group', groupRouter);
  app.use('/api/group', groupRouter);
}
