import { Router } from 'express';
import { TipInputSchema, TipUpdateSchema } from '@panasecreto/shared';
import * as store from './store';
import { authAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { handleStore, validateBody } from '../../utils/http';

/** Tips rotativos (montado en /api/tips) */
const router: Router = Router();
const handle = (fn: Parameters<typeof handleStore>[0]) => handleStore(fn, controllerError);

// Público: la app pide los tips de una pantalla (?screen=sobre.lista&general=true)
router.get('/', handle((req) => store.tipsForScreen(req.query)));

router.get('/admin', authAdminOnly(), handle((req) => store.adminList(req.query)));
router.post(
  '/admin',
  authAdminOnly(),
  handle((req) => {
    const v = validateBody(TipInputSchema, req.body);
    return v.error ?? store.adminCreate(v.data);
  })
);
router.patch(
  '/admin/:id',
  authAdminOnly(),
  handle((req) => {
    const v = validateBody(TipUpdateSchema, req.body);
    return v.error ?? store.adminUpdate(req.params.id, v.data);
  })
);
router.delete('/admin/:id', authAdminOnly(), handle((req) => store.adminDelete(req.params.id)));

export default router;
