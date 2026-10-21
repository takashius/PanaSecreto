import { getSystemConfig as storeGetConfig, updateSystemConfig as storeUpdateConfig } from './store';
import { ISystemConfig } from './model';
import { deleteImage } from '../../services/storage';
import type { UploadedImage } from '../../types/general';

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
  files?: Record<string, UploadedImage | undefined>
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
  if (files?.logo?.url) {
    payload.logoUrl = files.logo.url;
  } else if (input.logoUrl !== undefined) {
    payload.logoUrl = input.logoUrl;
  }

  // Si se subió un favicon por multipart a Cloudinary
  if (files?.favicon?.url) {
    payload.faviconUrl = files.favicon.url;
  } else if (input.faviconUrl !== undefined) {
    payload.faviconUrl = input.faviconUrl;
  }

  const previous = await storeGetConfig();
  const updated = await storeUpdateConfig(payload);
  // Borra de Cloudinary las imágenes reemplazadas
  if (payload.logoUrl !== undefined && previous.logoUrl && previous.logoUrl !== payload.logoUrl) {
    await deleteImage(previous.logoUrl);
  }
  if (payload.faviconUrl !== undefined && previous.faviconUrl && previous.faviconUrl !== payload.faviconUrl) {
    await deleteImage(previous.faviconUrl);
  }
  return updated;
}
