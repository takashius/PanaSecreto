import { Router } from 'express';
import * as store from './store';
import auth from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { handleStore } from '../../utils/http';
import { IGetUserAuthInfoRequest } from '../../types/general';

/** Notificaciones dentro de la app (montado en /api/notifications) */
const router: Router = Router();
const handle = (fn: Parameters<typeof handleStore>[0]) => handleStore(fn, controllerError);
const uid = (req: IGetUserAuthInfoRequest) => req.user!._id;

// ?unread=true&groupId=&page=&limit=
router.get('/', auth(), handle((req) => store.listNotifications(uid(req), req.query)));
router.get('/unread-count', auth(), handle((req) => store.unreadCount(uid(req))));
// Marcar todas como leídas (opcional ?groupId=)
router.post('/read-all', auth(), handle((req) => store.markAllRead(uid(req), req.query.groupId ?? req.body?.groupId)));
router.post('/:id/read', auth(), handle((req) => store.markRead(uid(req), req.params.id)));
router.delete('/:id', auth(), handle((req) => store.deleteNotification(uid(req), req.params.id)));

export default router;
