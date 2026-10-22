/**
 * Sube el logo horizontal de EntrePanas a Cloudinary con un public_id fijo, para usarlo en los correos.
 * Uso: pnpm --filter @panasecreto/backend mail:logo
 * Vuelve a ejecutarlo si cambia el logo (sobrescribe la imagen anterior).
 */
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/commons';
import { MAIL_LOGO_PUBLIC_ID } from '../services/mailTemplates';

const LOGO_FILE = path.resolve(__dirname, '../../../../assets/logos/logo-horizontal-transparente.png');

async function main(): Promise<void> {
  const { CLOUD_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } = config.cloudinary;
  if (!CLOUD_NAME || !CLOUDINARY_KEY || !CLOUDINARY_SECRET) {
    throw new Error('Faltan CLOUD_NAME, CLOUDINARY_KEY o CLOUDINARY_SECRET en el .env del backend.');
  }
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: CLOUDINARY_KEY, api_secret: CLOUDINARY_SECRET, secure: true });
  const result = await cloudinary.uploader.upload(LOGO_FILE, {
    public_id: MAIL_LOGO_PUBLIC_ID,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
  });
  console.log(`Logo de correos subido: ${result.secure_url} (${result.width}×${result.height})`);
}

main().catch((error: unknown) => {
  console.error('No se pudo subir el logo:', (error as Error).message);
  process.exit(1);
});
