import { Router } from 'express';
import { SendGroupMessageSchema } from '@panasecreto/shared';
import * as store from './store';
import auth from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { handleStore, validateBody } from '../../utils/http';
import { IGetUserAuthInfoRequest } from '../../types/general';

const handle = (fn: Parameters<typeof handleStore>[0]) => handleStore(fn, controllerError);
const uid = (req: IGetUserAuthInfoRequest) => req.user!._id;

/** Lista de chats del usuario (montado en /api/chat) */
export const chatListRouter: Router = Router();
chatListRouter.get('/', auth(), handle((req) => store.listChats(uid(req))));

/** Chat de un grupo (montado en /group/:id/chat con mergeParams) */
const router: Router = Router({ mergeParams: true });
const gid = (req: IGetUserAuthInfoRequest) => String(req.params.id);

// Historial: ?before=<id o fecha>&limit=50
router.get('/', auth(), handle((req) => store.getHistory(uid(req), gid(req), req.query)));
router.post(
  '/',
  auth(),
  handle((req) => {
    const v = validateBody(SendGroupMessageSchema, req.body);
    return v.error ?? store.sendMessage(uid(req), gid(req), v.data);
  })
);
router.post('/read', auth(), handle((req) => store.markRead(uid(req), gid(req))));

export default router;
