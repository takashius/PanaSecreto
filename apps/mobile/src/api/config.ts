import Constants from 'expo-constants';

/**
 * URL de la API de EntrePanas.
 * 1. EXPO_PUBLIC_API_URL (archivo .env de apps/mobile o variable de EAS).
 * 2. En desarrollo con Expo Go: la misma IP de la computadora que sirve Metro, puerto 4000.
 * 3. localhost:4000 como último recurso (emulador iOS / web).
 */
function devMachineUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri; // p. ej. "192.168.1.10:8081"
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:4000` : null;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || devMachineUrl() || 'http://localhost:4000').replace(/\/$/, '');
