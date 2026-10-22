import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from '../api/config';
import { ApiError } from '../api/client';
import { exchangeGoogleTicket, type SessionPayload } from '../api/auth';

// En la web cierra la ventana emergente al volver; en el teléfono no hace nada
WebBrowser.maybeCompleteAuthSession();

const ERROR_MESSAGES: Record<string, string> = {
  GOOGLE_NOT_CONFIGURED: 'El inicio de sesión con Google aún no está configurado en el servidor.',
  GOOGLE_EMAIL_NOT_VERIFIED: 'Tu correo de Google no está verificado.',
  USER_INACTIVE: 'Tu cuenta ha sido desactivada por un administrador.',
  GOOGLE_TOKEN_INVALID: 'Google no confirmó tu identidad. Intenta de nuevo.',
  GOOGLE_EXCHANGE_FAILED: 'Google no aceptó el inicio de sesión. Intenta de nuevo.',
  GOOGLE_UNAVAILABLE: 'No pudimos contactar a Google. Revisa tu conexión.',
};

/**
 * "Continuar con Google" compatible con nuestras sesiones:
 * 1. Abre el navegador en la API (/google/start), que lleva a Google.
 * 2. Google vuelve a la API, que inicia sesión (o crea la cuenta) y regresa a la app con un ticket de un solo uso.
 * 3. La app canjea el ticket por el mismo token que da el login con correo.
 *
 * Funciona en Expo Go (vuelve a exp://…) y en la app instalada (entrepanas://…).
 * Devuelve null si la persona cerró el navegador o canceló.
 */
export async function signInWithGoogle(): Promise<SessionPayload | null> {
  const returnUrl = Linking.createURL('auth/google');
  const startUrl = `${API_URL}/api/user/google/start?client=mobile&redirect=${encodeURIComponent(returnUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, { showInRecents: false });
  if (result.type !== 'success') return null;

  const { queryParams } = Linking.parse(result.url);
  const param = (key: string) => {
    const value = queryParams?.[key];
    return typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
  };
  const error = param('error');
  if (error === 'GOOGLE_CANCELLED') return null;
  if (error) throw new ApiError(400, ERROR_MESSAGES[error] || param('message') || 'No se pudo iniciar sesión con Google.', error);
  const ticket = param('ticket');
  if (!ticket) throw new ApiError(400, 'No se pudo iniciar sesión con Google.', 'GOOGLE_ERROR');
  return exchangeGoogleTicket(ticket);
}
