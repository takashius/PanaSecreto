import { Router, Response } from 'express';
import { authAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { sendOrError } from '../../utils/http';
import { IGetUserAuthInfoRequest } from '../../types/general';
import { getDashboardStats } from './store';

const router: Router = Router();

// Métricas para el dashboard del panel administrativo
router.get('/', authAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    sendOrError(res, await getDashboardStats(), controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

export default router;
