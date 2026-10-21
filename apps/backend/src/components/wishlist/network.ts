import { Router, Response, NextFunction } from 'express';
import { CreateWishSchema, UpdateWishSchema } from '@panasecreto/shared';
import type { ZodTypeAny, z } from 'zod';
import * as store from './store';
import { findGroupForMember } from '../group/store';
import auth from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { sendOrError } from '../../utils/http';
import { uploadImages, deleteImage } from '../../services/storage';
import { IGetUserAuthInfoRequest, StoreResponse } from '../../types/general';

/** Montado en /group/:id/wishlist (mergeParams para leer :id) */
const router: Router = Router({ mergeParams: true });

const wishImage = uploadImages([{ name: 'image', folder: 'wishlist' }]);

/** Verifica la membresía ANTES de aceptar archivos: un no-miembro no puede subir nada */
async function requireMember(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) {
  try {
    if (await findGroupForMember(String(req.params.id), req.user!._id)) return next();
    res.status(404).json({ code: 'GROUP_NOT_FOUND', message: 'Grupo no encontrado.' });
  } catch (error) {
    controllerError(error, req, res);
  }
}

const handle =
  (fn: (req: IGetUserAuthInfoRequest) => Promise<StoreResponse>) =>
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
      const result = await fn(req);
      // Si la operación falló, la imagen recién subida no debe quedar huérfana en Cloudinary
      if (result.status >= 400 && req.uploads?.image) await deleteImage(req.uploads.image.url);
      sendOrError(res, result, controllerError, req);
    } catch (error) {
      if (req.uploads?.image) await deleteImage(req.uploads.image.url);
      controllerError(error, req, res);
    }
  };

/**
 * Con multipart/form-data todos los campos llegan como texto:
 * se convierten números, booleanos y null antes de validar con Zod.
 */
function normalizeMultipart(req: IGetUserAuthInfoRequest): Record<string, unknown> {
  const body: Record<string, unknown> = { ...(req.body ?? {}) };
  if (!req.is('multipart/form-data')) return body;
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'string') continue;
    if (value === 'null') body[key] = null;
    else if (value === 'true' || value === 'false') body[key] = value === 'true';
    else if (key === 'estimatedPrice') body[key] = value.trim() === '' ? null : Number(value);
    else if (key === 'productUrl' && value.trim() === '') body[key] = null;
  }
  return body;
}

function validate<S extends ZodTypeAny>(schema: S, body: unknown): StoreResponse | { data: z.output<S> } {
  const parsed = schema.safeParse(body ?? {});
  if (parsed.success) return { data: parsed.data };
  return {
    status: 400,
    message: {
      code: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message || 'Datos inválidos.',
      errors: parsed.error.flatten().fieldErrors,
    },
  };
}

const uid = (req: IGetUserAuthInfoRequest) => req.user!._id;
const gid = (req: IGetUserAuthInfoRequest) => String(req.params.id);

// Mi lista de deseos en el grupo
router.get('/me', auth(), handle((req) => store.listMine(uid(req), gid(req))));
// Lista de deseos de mi amigo secreto (tras el sorteo)
router.get('/assigned', auth(), handle((req) => store.listAssigned(uid(req), gid(req))));

// Agregar deseo (JSON o multipart con campo "image")
router.post(
  '/',
  auth(),
  requireMember,
  wishImage,
  handle(async (req) => {
    const v = validate(CreateWishSchema, normalizeMultipart(req));
    if ('status' in v) return v;
    return store.addWish(uid(req), gid(req), v.data, req.uploads?.image);
  })
);

// Editar un deseo propio (JSON o multipart; removeImage=true quita la imagen)
router.patch(
  '/:wishId',
  auth(),
  requireMember,
  wishImage,
  handle(async (req) => {
    const v = validate(UpdateWishSchema, normalizeMultipart(req));
    if ('status' in v) return v;
    return store.updateWish(uid(req), gid(req), req.params.wishId, v.data, req.uploads?.image);
  })
);

router.delete('/:wishId', auth(), handle((req) => store.deleteWish(uid(req), gid(req), req.params.wishId)));

export default router;
