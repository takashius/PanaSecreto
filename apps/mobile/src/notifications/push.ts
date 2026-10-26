import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { api } from '../api/client';

/**
 * Notificaciones push con Expo.
 *
 * - Expo Go en Android ya no recibe push remotas (SDK 53+): ahí todo esto se salta y la app
 *   sigue con la campana por consulta periódica. En un build propio (EAS) funciona completo.
 * - `expo-notifications` se carga solo cuando se puede usar: en Expo Go Android, importarlo
 *   lanza un error al registrar su listener de tokens.
 */

type NotificationsModule = typeof import('expo-notifications');
type NotificationResponse = import('expo-notifications').NotificationResponse;

/** Lo que manda el backend en `data` (services/push.ts) */
export interface PushData {
  notificationId?: string;
  kind?: string;
  target?: 'myWish' | 'wish' | 'envelope' | 'group' | 'chat' | 'reveal';
  groupId?: string | null;
  wishId?: string | null;
}

/** Mismo canal que usa el backend (`channelId`) */
export const ANDROID_CHANNEL_ID = 'default';

export const pushAvailable = Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

let modulePromise: Promise<NotificationsModule> | null = null;
const load = () => (modulePromise ??= import('expo-notifications'));

let configured = false;
let registeredToken: string | null = null;
const handledResponses = new Set<string>();

/** Muestra las push también con la app abierta y crea el canal de Android (una sola vez) */
async function configure(N: NotificationsModule) {
  if (configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Avisos de EntrePanas',
      description: 'Sorteo, comentarios de tus deseos, pistas del chat y recordatorios',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFC107',
    });
  }
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Pide permiso (solo si aún se puede preguntar), obtiene el token de Expo y lo registra en la API.
 * Devuelve el token o null si no hay push en este teléfono/entorno o la persona no dio permiso.
 */
export async function registerForPush(): Promise<string | null> {
  if (!pushAvailable) return null;
  const Device = await import('expo-device');
  if (!Device.isDevice) return null; // los emuladores no reciben push
  const N = await load();
  await configure(N);

  let perm = await N.getPermissionsAsync();
  if (!perm.granted && perm.canAskAgain) perm = await N.requestPermissionsAsync();
  if (!perm.granted) return null;

  const { data: token } = await N.getExpoPushTokenAsync({ projectId: projectId() });
  await api('/api/push/token', {
    method: 'POST',
    body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android', deviceName: Device.deviceName ?? undefined },
  });
  registeredToken = token;
  return token;
}

/** Al cerrar sesión: este teléfono deja de recibir push de la cuenta (necesita el token de sesión aún vigente) */
export async function unregisterFromPush(): Promise<void> {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  await api('/api/push/token', { method: 'DELETE', body: { token }, timeoutMs: 5000 }).catch(() => undefined);
  if (pushAvailable) await (await load()).setBadgeCountAsync(0).catch(() => false);
}

/** Número del ícono de la app (iOS y algunos launchers de Android) */
export async function setAppBadge(count: number): Promise<void> {
  if (!pushAvailable || !modulePromise) return;
  await (await load()).setBadgeCountAsync(count).catch(() => false);
}

interface PushHandlers {
  /** Llegó una push con la app abierta */
  onReceive: (data: PushData) => void;
  /** La persona tocó una push (con la app abierta, en segundo plano o cerrada) */
  onTap: (data: PushData) => void;
}

/** Escucha push recibidas y tocadas; devuelve la función para dejar de escuchar */
export function subscribeToPush({ onReceive, onTap }: PushHandlers): () => void {
  if (!pushAvailable) return () => undefined;
  let alive = true;
  const subs: Array<{ remove: () => void }> = [];

  const handleResponse = (response: NotificationResponse | null) => {
    if (!response || !alive) return;
    const id = response.notification.request.identifier;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);
    onTap((response.notification.request.content.data ?? {}) as PushData);
  };

  void load().then(async (N) => {
    if (!alive) return;
    await configure(N);
    subs.push(N.addNotificationReceivedListener((n) => onReceive((n.request.content.data ?? {}) as PushData)));
    subs.push(N.addNotificationResponseReceivedListener(handleResponse));
    // La app se abrió tocando una push (estaba cerrada)
    handleResponse(await N.getLastNotificationResponseAsync());
  });

  return () => {
    alive = false;
    subs.forEach((s) => s.remove());
  };
}
