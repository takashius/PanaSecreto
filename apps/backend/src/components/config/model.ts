import { Schema, model, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CONFIG = {
  key: 'system',
  appName: 'PanaSecreto',
  primaryColor: '#1E1338', // Morado Noche
  secondaryColor: '#F7A800', // Amarillo Araguaney
  accentColor: '#1D84B5', // Azul Caribe
  logoUrl: '',
  faviconUrl: '',
};

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'system',
    },
    appName: {
      type: String,
      required: true,
      trim: true,
      default: 'PanaSecreto',
    },
    primaryColor: {
      type: String,
      required: true,
      trim: true,
      default: '#1E1338',
    },
    secondaryColor: {
      type: String,
      required: true,
      trim: true,
      default: '#F7A800',
    },
    accentColor: {
      type: String,
      required: true,
      trim: true,
      default: '#1D84B5',
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    faviconUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

export const SystemConfig = model<ISystemConfig>('SystemConfig', systemConfigSchema);
export default SystemConfig;
