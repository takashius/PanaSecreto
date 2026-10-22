import * as dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';
const isDeployedEnv = nodeEnv === 'production' || nodeEnv === 'staging';

if (nodeEnv !== 'production') {
  dotenv.config();
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`[config] ${name} es obligatorio cuando NODE_ENV=${nodeEnv}`);
  }
  return value.trim();
}

const KNOWN_WEAK_JWT_KEYS = new Set([
  'panasecreto-dev-jwt-secret-key-2026',
  'panasecreto_default_production_key_change_in_coolify',
  'super_jwt_secret_devops_coolify_2026',
  'tu_secreto_jwt_super_seguro_aqui',
  'generar_un_hash_seguro',
]);

const jwtKeyFromEnv = process.env.JWT_KEY?.trim() || process.env.JWT_SECRET?.trim();
if (isDeployedEnv) {
  const key = requireEnv('JWT_KEY', jwtKeyFromEnv);
  if (key.length < 32 || KNOWN_WEAK_JWT_KEYS.has(key)) {
    throw new Error(
      '[config] JWT_KEY es demasiado débil o es un valor de ejemplo. Usa al menos 32 caracteres aleatorios (ej. `openssl rand -hex 32`).'
    );
  }
}

const dbUrl: string = process.env.MONGO_URI || process.env.BD_URL || 'mongodb://localhost:27017/panasecreto';

const config = {
  nodeEnv,
  isDeployedEnv,
  dbUrl,
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || 'http://localhost',
  JWT_KEY: isDeployedEnv
    ? (jwtKeyFromEnv as string)
    : jwtKeyFromEnv || 'panasecreto-dev-jwt-secret-key-2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dev: nodeEnv === 'development' || nodeEnv === 'test',
  userAdminEmail: process.env.USER_ADMIN_EMAIL || 'admin@panasecreto.local',
  // En entornos desplegados no hay contraseña por defecto: si falta, no se crea el admin semilla.
  userAdminPassword:
    process.env.USER_ADMIN_PASSWORD?.trim() || (isDeployedEnv ? '' : 'Admin123456!'),
  bcryptRounds: Math.max(10, parseInt(process.env.BCRYPT_ROUNDS || '10', 10) || 10),
  userAdminName: process.env.USER_ADMIN_NAME || 'Administrador',
  mail: {
    // 'mailjet' envía correos reales; 'log' solo los imprime en consola (desarrollo/tests)
    transport: (process.env.MAIL_TRANSPORT ||
      (process.env.MJ_APIKEY_PUBLIC && process.env.MJ_APIKEY_PRIVATE ? 'mailjet' : 'log')) as 'mailjet' | 'log',
    fromEmail: process.env.MAIL_FROM_EMAIL?.trim() || '',
    fromName: process.env.MAIL_FROM_NAME?.trim() || 'EntrePanas',
    mailjetPublicKey: process.env.MJ_APIKEY_PUBLIC?.trim() || '',
    mailjetPrivateKey: process.env.MJ_APIKEY_PRIVATE?.trim() || '',
    // URL pública del logo de los correos; por defecto, el que sube `pnpm mail:logo` a Cloudinary
    logoUrl: process.env.MAIL_LOGO_URL?.trim() || '',
  },
  uploads: {
    // 'cloudinary' sube de verdad; 'mock' simula la subida (tests y desarrollo sin credenciales)
    transport: (process.env.UPLOAD_TRANSPORT ||
      (process.env.CLOUD_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET
        ? 'cloudinary'
        : isDeployedEnv
          ? 'cloudinary'
          : 'mock')) as 'cloudinary' | 'mock',
    maxFileSizeMb: 8,
  },
  appUrl: (process.env.APP_PUBLIC_URL || 'https://entrepanas.app').replace(/\/$/, ''),
  adminUrl: (process.env.ADMIN_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, ''),
  cloudinary: {
    CLOUD_NAME: process.env.CLOUD_NAME || '',
    CLOUDINARY_KEY: process.env.CLOUDINARY_KEY || '',
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET || '',
    FOLDER_NAME: process.env.FOLDER_NAME || 'EntrePanas',
  },
};

export default config;
