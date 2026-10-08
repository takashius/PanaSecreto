import { Router, Request, Response } from 'express';
import { getConfig, updateConfig } from './controller';
import auth from '../../middleware/auth';
import { ADMIN_ROLES } from '../../config/roles';
import { handleConfigUpload, pickUploadedFiles } from '../../middleware/saveFile';

const router = Router();

// GET /api/config - Obtiene la configuración pública del sistema
router.get('/', async (_req: Request, res: Response) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error: any) {
    console.error('[Config Network] Error getting config:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la configuración' });
  }
});

// PUT /api/config - Actualiza configuración y sube archivos a Cloudinary
router.put('/', auth(ADMIN_ROLES), handleConfigUpload, async (req: Request, res: Response) => {
  try {
    const uploadedFiles = (req as any).uploadedFiles || pickUploadedFiles(req);
    const result = await updateConfig(req.body, uploadedFiles);

    if ('status' in result && typeof result.status === 'number' && result.status >= 400) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Config Network] Error updating config:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la configuración' });
  }
});

// PATCH /api/config - Soporte alternativo de actualización
router.patch('/', auth(ADMIN_ROLES), handleConfigUpload, async (req: Request, res: Response) => {
  try {
    const uploadedFiles = (req as any).uploadedFiles || pickUploadedFiles(req);
    const result = await updateConfig(req.body, uploadedFiles);

    if ('status' in result && typeof result.status === 'number' && result.status >= 400) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Config Network] Error updating config:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la configuración' });
  }
});

export default router;
