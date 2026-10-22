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
  appName: 'EntrePanas',
  primaryColor: '#0B2D5B', // Azul Marino
  secondaryColor: '#FFC107', // Amarillo Pana
  accentColor: '#00B4D8', // Celeste Caribe
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
      default: 'EntrePanas',
    },
    primaryColor: {
      type: String,
      required: true,
      trim: true,
      default: '#0B2D5B',
    },
    secondaryColor: {
      type: String,
      required: true,
      trim: true,
      default: '#FFC107',
    },
    accentColor: {
      type: String,
      required: true,
      trim: true,
      default: '#00B4D8',
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
