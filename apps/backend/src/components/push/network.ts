import { Router } from 'express';
import * as store from './store';
import auth from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { handleStore } from '../../utils/http';
import { IGetUserAuthInfoRequest } from '../../types/general';

/** Teléfonos registrados para notificaciones push (montado en /api/push) */
const router: Router = Router();
const handle = (fn: Parameters<typeof handleStore>[0]) => handleStore(fn, controllerError);
const uid = (req: IGetUserAuthInfoRequest) => req.user!._id;

// { token: 'ExponentPushToken[…]', platform?: 'android'|'ios', deviceName? }
router.post('/token', auth(), handle((req) => store.registerToken(uid(req), req.body)));
// { token }
router.delete('/token', auth(), handle((req) => store.removeToken(uid(req), req.body)));

export default router;
