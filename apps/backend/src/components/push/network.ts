import { Router } from 'express';
import * as store from './store';
import * as admin from './admin.store';
import auth, { authAdminOnly } from '../../middleware/auth';
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

/* ---- Panel: avisos push a todos, a un grupo o a usuarios elegidos ---- */
router.get('/admin/stats', authAdminOnly(), handle(() => admin.pushStats()));
// ?audience=all|group|users&groupId=&userIds=a,b,c
router.get('/admin/audience', authAdminOnly(), handle((req) => admin.previewAudience(req.query)));
// { audience, groupId?, userIds?, title, body, inApp? }
router.post('/admin/send', authAdminOnly(), handle((req) => admin.sendCampaign(uid(req), req.body)));
router.get('/admin/campaigns', authAdminOnly(), handle((req) => admin.listCampaigns(req.query)));

export default router;
