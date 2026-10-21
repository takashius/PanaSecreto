import { Router, Request, Response } from 'express';
import { getConfig, updateConfig } from './controller';
import auth from '../../middleware/auth';
import { ADMIN_ROLES } from '../../config/roles';
import { uploadImages } from '../../services/storage';
import { IGetUserAuthInfoRequest } from '../../types/general';

const router = Router();

// GET /api/config - Configuración pública del sistema (nombre, colores, logo, favicon)
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await getConfig());
  } catch (error) {
    console.error('[config] Error al obtener la configuración:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error al obtener la configuración' });
  }
});

// PUT /api/config - Actualiza la configuración; logo y favicon se suben a Cloudinary
router.put(
  '/',
  auth(ADMIN_ROLES),
  uploadImages([
    { name: 'logo', folder: 'branding' },
    { name: 'favicon', folder: 'branding' },
  ]),
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
      const result = await updateConfig(req.body, req.uploads);
      if ('status' in result && typeof result.status === 'number' && result.status >= 400) {
        res.status(result.status).json({ code: 'VALIDATION_ERROR', message: result.message });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error('[config] Error al actualizar la configuración:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error al actualizar la configuración' });
    }
  }
);

export default router;
