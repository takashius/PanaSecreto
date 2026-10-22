import { MIN_PASSWORD } from './password';

/** Validaciones de formularios compartidas por las pantallas */
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** Contraseñas nuevas: mínimo 8 caracteres y al menos un número */
export const PASSWORD_MIN_LENGTH = MIN_PASSWORD;
export function newPasswordError(value: string): string | null {
  if (!value || value.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (!/\d/.test(value)) return 'La contraseña debe incluir al menos un número.';
  return null;
}

/** Teléfono venezolano: dígitos locales → +58XXXXXXXXXX (sin el 0 inicial) */
export function toInternationalPhone(localDigits: string): string | undefined {
  const digits = localDigits.replace(/\D/g, '').replace(/^0+/, '');
  return digits ? `+58${digits}` : undefined;
}

export function toLocalPhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/^58/, '');
}

/** "Carlos Andrés Pérez" → { name: "Carlos", lastName: "Andrés Pérez" } */
export function splitFullName(fullname: string): { name: string; lastName?: string } {
  const parts = fullname.trim().split(/\s+/);
  return { name: parts[0] ?? '', lastName: parts.slice(1).join(' ') || undefined };
}
