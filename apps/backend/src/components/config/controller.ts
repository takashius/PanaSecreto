import { getSystemConfig as storeGetConfig, updateSystemConfig as storeUpdateConfig } from './store';
import { ISystemConfig } from './model';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;

export async function getConfig(): Promise<ISystemConfig> {
  return await storeGetConfig();
}

export interface UpdateConfigInput {
  appName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export async function updateConfig(
  input: UpdateConfigInput,
  files?: Record<string, Express.Multer.File | undefined>
): Promise<ISystemConfig | { status: number; message: string }> {
  const payload: Partial<ISystemConfig> = {};

  if (input.appName !== undefined) {
    const trimmed = String(input.appName).trim();
    if (!trimmed) {
      return { status: 400, message: 'El nombre de la aplicación no puede estar vacío.' };
    }
    payload.appName = trimmed;
  }

  if (input.primaryColor !== undefined) {
    const color = String(input.primaryColor).trim();
    if (!HEX_COLOR_REGEX.test(color)) {
      return { status: 400, message: 'El color principal debe ser un código HEX válido (ej. #1E1338).' };
    }
    payload.primaryColor = color;
  }

  if (input.secondaryColor !== undefined) {
    const color = String(input.secondaryColor).trim();
    if (!HEX_COLOR_REGEX.test(color)) {
      return { status: 400, message: 'El color secundario debe ser un código HEX válido (ej. #F7A800).' };
    }
    payload.secondaryColor = color;
  }

  if (input.accentColor !== undefined) {
    const color = String(input.accentColor).trim();
    if (!HEX_COLOR_REGEX.test(color)) {
      return { status: 400, message: 'El color de acento debe ser un código HEX válido (ej. #1D84B5).' };
    }
    payload.accentColor = color;
  }

  // Si se subió un logo por multipart a Cloudinary
  if (files?.logo?.path) {
    payload.logoUrl = files.logo.path;
  } else if (input.logoUrl !== undefined) {
    payload.logoUrl = input.logoUrl;
  }

  // Si se subió un favicon por multipart a Cloudinary
  if (files?.favicon?.path) {
    payload.faviconUrl = files.favicon.path;
  } else if (input.faviconUrl !== undefined) {
    payload.faviconUrl = input.faviconUrl;
  }

  return await storeUpdateConfig(payload);
}
