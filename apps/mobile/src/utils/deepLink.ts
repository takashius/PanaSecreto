import { normalizeInviteCode } from './format';

/**
 * Extrae el código de un enlace de invitación. Acepta las tres formas en que llega:
 *  - App instalada:  entrepanas://join/PANA-XXXX-XX
 *  - Expo Go:        exp://192.168.1.10:8081/--/join/PANA-XXXX-XX
 *  - Página web:     https://…/join/PANA-XXXX-XX
 * Devuelve null si el enlace no es de invitación o el código no está completo.
 */
export function joinCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const path = url.split(/[?#]/)[0];
  const match = /(?:^|\/)join\/([^/]+)\/?$/i.exec(path);
  if (!match) return null;
  let raw = match[1];
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const code = normalizeInviteCode(raw);
  return /^PANA-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code) ? code : null;
}
