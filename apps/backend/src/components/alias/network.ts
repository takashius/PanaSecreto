import { Router } from 'express';
import { AliasSuggestionInputSchema, AliasSuggestionUpdateSchema } from '@panasecreto/shared';
import * as store from './store';
import { authAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { handleStore, validateBody } from '../../utils/http';
import { IGetUserAuthInfoRequest } from '../../types/general';

/** Catálogo de alias: administración desde el panel web (montado en /api/alias) */
const router: Router = Router();
const handle = (fn: Parameters<typeof handleStore>[0]) => handleStore(fn, controllerError);

router.get('/admin', authAdminOnly(), handle((req) => store.adminList(req.query)));
// Alias propios escritos por usuarios (moderación)
router.get('/admin/custom', authAdminOnly(), handle((req) => store.adminListCustom(req.query)));
router.delete(
  '/admin/custom/:groupId/:userId',
  authAdminOnly(),
  handle((req) => store.adminClearMemberAlias(req.params.groupId, req.params.userId))
);
router.post(
  '/admin',
  authAdminOnly(),
  handle((req: IGetUserAuthInfoRequest) => {
    const v = validateBody(AliasSuggestionInputSchema, req.body);
    return v.error ?? store.adminCreate(v.data);
  })
);
router.patch(
  '/admin/:id',
  authAdminOnly(),
  handle((req) => {
    const v = validateBody(AliasSuggestionUpdateSchema, req.body);
    return v.error ?? store.adminUpdate(req.params.id, v.data);
  })
);
router.delete('/admin/:id', authAdminOnly(), handle((req) => store.adminDelete(req.params.id)));

export default router;
