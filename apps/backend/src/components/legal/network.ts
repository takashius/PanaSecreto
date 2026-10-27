import { Router, Request, Response } from 'express';
import * as controller from './controller';
import auth from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { ADMIN_ROLES } from '../../config/roles';
import { sendOrError, sendResult } from '../../utils/http';
import { legalCancellationRateLimiter } from '../../middleware/rateLimit';

const router = Router();

router.get('/terms', (req: Request, res: Response) => {
  const lang = typeof req.query.lang === 'string' ? req.query.lang : req.headers['accept-language'];
  void controller
    .getPublicLegal('terms', String(lang || 'es').slice(0, 2))
    .then((data) => sendResult(res, data))
    .catch((e) => {
      console.error(e);
      res.status(500).send('Unexpected Error');
    });
});

router.get('/privacy', (req: Request, res: Response) => {
  const lang = typeof req.query.lang === 'string' ? req.query.lang : req.headers['accept-language'];
  void controller
    .getPublicLegal('privacy', String(lang || 'es').slice(0, 2))
    .then((data) => sendResult(res, data))
    .catch((e) => {
      console.error(e);
      res.status(500).send('Unexpected Error');
    });
});

router.get('/admin/:key', auth(ADMIN_ROLES), (req: Request, res: Response) => {
  void controller
    .getAdminLegal(req.params.key)
    .then((data) => sendResult(res, data))
    .catch((e) => {
      console.error(e);
      res.status(500).send('Unexpected Error');
    });
});

router.patch('/admin/:key', auth(ADMIN_ROLES), (req: Request, res: Response) => {
  void controller
    .saveLegal(req.params.key, req.body)
    .then((data) => sendOrError(res, data, controllerError, req))
    .catch((e) => {
      console.error(e);
      res.status(500).send('Unexpected Error');
    });
});

router.post('/service-cancellation', legalCancellationRateLimiter, (req: Request, res: Response) => {
  void controller
    .postServiceCancellation(req.body)
    .then((data) => sendOrError(res, data, controllerError, req))
    .catch((e) => {
      console.error(e);
      res.status(500).send('Unexpected Error');
    });
});

export default router;
