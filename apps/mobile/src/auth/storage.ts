import * as SecureStore from 'expo-secure-store';
import type { SessionUser } from '../types/session';

/** La sesión vive en el almacenamiento cifrado del teléfono (Keychain / Keystore) */
const TOKEN_KEY = 'entrepanas.session.token';
const USER_KEY = 'entrepanas.session.user';

export interface StoredSession {
  token: string;
  user: SessionUser | null;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return null;
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return { token, user: raw ? (JSON.parse(raw) as SessionUser) : null };
  } catch {
    return null;
  }
}

export async function saveSession(token: string, user: SessionUser): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function saveUser(user: SessionUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => undefined);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined),
  ]);
}
