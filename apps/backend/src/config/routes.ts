import { Express } from 'express';
import userRouter from '../components/user/network';
import configRouter from '../components/config/network';
import groupRouter from '../components/group/network';
import wishlistRouter from '../components/wishlist/network';
import statsRouter from '../components/stats/network';
import aliasRouter from '../components/alias/network';
import tipRouter from '../components/tip/network';
import notificationRouter from '../components/notification/network';
import pushRouter from '../components/push/network';
import groupChatRouter, { chatListRouter } from '../components/chat/network';
import { healthRouter } from '../routes/health.routes';
import { inviteRouter } from '../routes/invite.routes';

export default function registerRoutes(app: Express) {
  // Estado y chequeo de salud
  app.use('/api', healthRouter);

  // Página pública de los enlaces de invitación: abre la app en "Unirse" con el código
  app.use('/', inviteRouter);

  // Módulo de Usuarios y Autenticación
  app.use('/user', userRouter);
  app.use('/api/user', userRouter);

  // Módulo de Configuración del Sistema
  app.use('/config', configRouter);
  app.use('/api/config', configRouter);

  // Estadísticas para el dashboard administrativo
  app.use('/api/stats', statsRouter);

  // Catálogos editables desde el panel: alias sugeridos y tips rotativos
  app.use('/api/alias', aliasRouter);
  app.use('/api/tips', tipRouter);

  // Notificaciones dentro de la app y lista de chats
  app.use('/api/notifications', notificationRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/chat', chatListRouter);

  // Módulo de Grupos de Amigo Secreto (sorteo, invitaciones, asignaciones)
  app.use('/group/:id/chat', groupChatRouter);
  app.use('/api/group/:id/chat', groupChatRouter);
  app.use('/group/:id/wishlist', wishlistRouter);
  app.use('/api/group/:id/wishlist', wishlistRouter);
  app.use('/group', groupRouter);
  app.use('/api/group', groupRouter);
}
