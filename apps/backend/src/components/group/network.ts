import { Router, Response } from 'express';
import * as controller from './controller';
import auth, { authAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { sendOrError } from '../../utils/http';
import { isAdminRole } from '../../config/roles';
import { IGetUserAuthInfoRequest } from '../../types/general';
import { StoreResponse } from '../../types/general';

const router: Router = Router();

type Handler = (req: IGetUserAuthInfoRequest) => Promise<StoreResponse>;

/** Envuelve un handler: ejecuta, responde y captura errores inesperados. */
const handle = (fn: Handler) => async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await fn(req);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
};

const uid = (req: IGetUserAuthInfoRequest) => req.user!._id;
const isAdmin = (req: IGetUserAuthInfoRequest) => isAdminRole(req.user!.role);

/* ---------- Administración (panel web) ---------- */
router.get('/admin', authAdminOnly(), handle((req) => controller.adminListGroups(req.query)));

/* ---------- Grupos del usuario ---------- */
// Crear grupo (el creador queda como organizador)
router.post('/', auth(), handle((req) => controller.createGroup(uid(req), req.body)));
// Mis grupos: ?scope=all|created|joined
router.get('/', auth(), handle((req) => controller.listMyGroups(uid(req), req.query.scope)));

/* ---------- Invitaciones ---------- */
// Vista previa antes de unirse
router.get('/code/:code', auth(), handle((req) => controller.previewByCode(uid(req), req.params.code)));
// Unirse con código
router.post('/join', auth(), handle((req) => controller.joinGroup(uid(req), req.body)));

/* ---------- Detalle y edición ---------- */
router.get('/:id', auth(), handle((req) => controller.getGroup(uid(req), req.params.id, isAdmin(req))));
router.patch('/:id', auth(), handle((req) => controller.updateGroup(uid(req), req.params.id, req.body)));
router.delete('/:id', auth(), handle((req) => controller.deleteGroup(uid(req), req.params.id, isAdmin(req))));
router.post(
  '/:id/invite-code',
  auth(),
  handle((req) => controller.regenerateInviteCode(uid(req), req.params.id))
);

/* ---------- Miembros ---------- */
router.delete('/:id/members/me', auth(), handle((req) => controller.leaveGroup(uid(req), req.params.id)));
router.delete(
  '/:id/members/:userId',
  auth(),
  handle((req) => controller.removeMember(uid(req), req.params.id, req.params.userId))
);
router.put(
  '/:id/members/:userId/exclusions',
  auth(),
  handle((req) => controller.setExclusions(uid(req), req.params.id, req.params.userId, req.body))
);

/* ---------- Sorteo y ciclo de vida ---------- */
router.post('/:id/draw', auth(), handle((req) => controller.drawGroup(uid(req), req.params.id)));
router.delete('/:id/draw', auth(), handle((req) => controller.resetDraw(uid(req), req.params.id)));
router.post('/:id/reveal', auth(), handle((req) => controller.revealGroup(uid(req), req.params.id)));
router.post('/:id/complete', auth(), handle((req) => controller.completeGroup(uid(req), req.params.id)));

/* ---------- Asignaciones ---------- */
// "Abrir el sobre": a quién le regalo yo
router.get('/:id/assignment', auth(), handle((req) => controller.getMyAssignment(uid(req), req.params.id)));
// Lista completa (solo tras revelar)
router.get('/:id/assignments', auth(), handle((req) => controller.listAssignments(uid(req), req.params.id)));

export default router;
