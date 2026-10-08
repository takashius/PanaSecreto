import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import config from '../config/commons';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: config.cloudinary.CLOUD_NAME,
  api_key: config.cloudinary.CLOUDINARY_KEY,
  api_secret: config.cloudinary.CLOUDINARY_SECRET,
});

interface CloudinaryStorageParams {
  folder: string;
  allowed_formats?: string[];
  public_id?: (req: Request, file: Express.Multer.File) => string;
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: config.cloudinary.FOLDER_NAME,
    allowed_formats: ['jpeg', 'png', 'jpg', 'gif', 'svg', 'ico', 'webp'],
    public_id: (_req: Request, file: Express.Multer.File) => {
      const cleanName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${Date.now()}_${cleanName}`;
    },
  } as CloudinaryStorageParams,
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
});

export function pickUploadedFiles(req: Request): Record<string, Express.Multer.File | undefined> {
  const result: Record<string, Express.Multer.File | undefined> = {};
  if (req.file) {
    result[req.file.fieldname] = req.file;
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => {
        result[f.fieldname] = f;
      });
    } else {
      Object.keys(req.files).forEach((key) => {
        const fileList = (req.files as Record<string, Express.Multer.File[]>)[key];
        if (fileList && fileList.length > 0) {
          result[key] = fileList[0];
        }
      });
    }
  }
  return result;
}

/**
 * Middleware para subida de campos opcionales como logo y favicon
 */
export const handleConfigUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ])(req, res, (err: any) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Error al procesar la subida del archivo a Cloudinary',
      });
      return;
    }
    (req as any).uploadedFiles = pickUploadedFiles(req);
    next();
  });
};

export const removeImage = async (urlImage?: string): Promise<boolean> => {
  if (!urlImage) return false;
  try {
    const parts = urlImage.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    const publicId = `${config.cloudinary.FOLDER_NAME}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('[Cloudinary] Error removing image:', error);
    return false;
  }
};

export { cloudinary };
