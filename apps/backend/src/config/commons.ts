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

const jwtKeyFromEnv = process.env.JWT_KEY?.trim() || process.env.JWT_SECRET?.trim();
if (isDeployedEnv) {
  requireEnv('JWT_KEY', jwtKeyFromEnv);
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
  userAdminPassword: process.env.USER_ADMIN_PASSWORD || 'Admin123456!',
  userAdminName: process.env.USER_ADMIN_NAME || 'Administrador',
  cloudinary: {
    CLOUD_NAME: process.env.CLOUD_NAME || '',
    CLOUDINARY_KEY: process.env.CLOUDINARY_KEY || '',
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET || '',
    FOLDER_NAME: process.env.FOLDER_NAME || 'PanaSecreto',
  },
};

export default config;
