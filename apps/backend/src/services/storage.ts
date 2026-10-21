import multer from 'multer';
import { randomBytes } from 'crypto';
import type { NextFunction, Response } from 'express';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import config from '../config/commons';
import type { IGetUserAuthInfoRequest, UploadedImage } from '../types/general';

/**
 * Subida de imágenes a Cloudinary con el SDK oficial v2.
 *
 * Flujo: multer guarda el archivo en memoria → se valida el tipo → se sube con upload_stream
 * a `<FOLDER_NAME>/<carpeta>` limitando el tamaño a 1600 px → `req.uploads[campo] = { url, publicId }`.
 *
 * Con UPLOAD_TRANSPORT=mock (tests) no se contacta a Cloudinary y se devuelven URLs simuladas.
 */

export type ImageFolder = 'avatars' | 'branding' | 'wishlist';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'ico'];

cloudinary.config({
  cloud_name: config.cloudinary.CLOUD_NAME,
  api_key: config.cloudinary.CLOUDINARY_KEY,
  api_secret: config.cloudinary.CLOUDINARY_SECRET,
  secure: true,
});

class UploadError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxFileSizeMb * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new UploadError(400, 'INVALID_FILE_TYPE', 'Formato no permitido. Usa JPG, PNG, WEBP, GIF o ICO.'));
  },
});

function cleanName(originalName: string): string {
  return (
    originalName
      .replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'imagen'
  );
}

/** Registro de operaciones simuladas (solo para tests) */
export const mockStorageLog: { uploaded: UploadedImage[]; deleted: string[] } = { uploaded: [], deleted: [] };

async function uploadBuffer(file: Express.Multer.File, folder: ImageFolder): Promise<UploadedImage> {
  const publicId = `${Date.now()}_${randomBytes(3).toString('hex')}_${cleanName(file.originalname)}`;
  const fullFolder = `${config.cloudinary.FOLDER_NAME}/${folder}`;

  if (config.uploads.transport === 'mock') {
    const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg').replace('vnd.microsoft.icon', 'ico') || 'png';
    const image = {
      url: `https://res.cloudinary.com/mock/image/upload/v1/${fullFolder}/${publicId}.${ext}`,
      publicId: `${fullFolder}/${publicId}`,
    };
    mockStorageLog.uploaded.push(image);
    return image;
  }

  if (!config.cloudinary.CLOUD_NAME || !config.cloudinary.CLOUDINARY_KEY || !config.cloudinary.CLOUDINARY_SECRET) {
    throw new UploadError(503, 'UPLOADS_NOT_CONFIGURED', 'La subida de imágenes no está configurada en el servidor.');
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: fullFolder,
        public_id: publicId,
        resource_type: 'image',
        allowed_formats: ALLOWED_FORMATS,
        // Limita a 1600 px y optimiza calidad: ahorra almacenamiento y datos móviles
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
      },
      (error, response) => {
        if (error || !response) reject(error ?? new Error('Respuesta vacía de Cloudinary'));
        else resolve(response);
      }
    );
    stream.end(file.buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Middleware: recibe los campos de imagen indicados (multipart/form-data),
 * los sube a Cloudinary y deja el resultado en `req.uploads`.
 * Los campos de texto del formulario quedan en `req.body` como strings.
 */
export function uploadImages(fields: Array<{ name: string; folder: ImageFolder }>) {
  const parser = memoryUpload.fields(fields.map((f) => ({ name: f.name, maxCount: 1 })));
  const folderOf = new Map(fields.map((f) => [f.name, f.folder]));

  return (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    parser(req, res, async (err: unknown) => {
      try {
        if (err) throw err;
        const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
        const uploads: Record<string, UploadedImage> = {};
        for (const [field, list] of Object.entries(files)) {
          const file = list?.[0];
          if (file) uploads[field] = await uploadBuffer(file, folderOf.get(field)!);
        }
        req.uploads = uploads;
        next();
      } catch (error) {
        if (error instanceof UploadError) {
          res.status(error.status).json({ code: error.code, message: error.message });
          return;
        }
        if (error instanceof multer.MulterError) {
          const tooBig = error.code === 'LIMIT_FILE_SIZE';
          res.status(tooBig ? 413 : 400).json({
            code: tooBig ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
            message: tooBig
              ? `La imagen supera el máximo de ${config.uploads.maxFileSizeMb} MB.`
              : 'No se pudo procesar el archivo enviado.',
          });
          return;
        }
        console.error('[storage] Error al subir a Cloudinary:', error);
        res.status(502).json({ code: 'UPLOAD_FAILED', message: 'No se pudo subir la imagen. Intenta de nuevo.' });
      }
    });
  };
}

/** Extrae el public_id de una URL de Cloudinary: .../upload/[transformaciones/]v123/<public_id>.<ext> */
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/(?:image|video|raw)\/upload\/(?:.*?\/)?v\d+\/(.+?)(?:\.[a-z0-9]+)?$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Borra una imagen de Cloudinary a partir de su URL. Nunca lanza. */
export async function deleteImage(url?: string | null): Promise<boolean> {
  if (!url) return false;
  const publicId = publicIdFromUrl(url);
  if (!publicId) return false;
  if (config.uploads.transport === 'mock') {
    mockStorageLog.deleted.push(publicId);
    return true;
  }
  // Solo se borran imágenes de nuestra propia cuenta
  if (!url.includes(`/${config.cloudinary.CLOUD_NAME}/`)) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    console.error('[storage] Error al borrar imagen:', error);
    return false;
  }
}
