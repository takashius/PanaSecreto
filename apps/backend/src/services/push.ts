import { Types } from 'mongoose';
import config from '../config/commons';
import { PushToken } from '../components/push/model';
import { Notification } from '../components/notification/model';
import { User } from '../components/user/model';
import type { NotificationKind, NotificationTarget } from '@panasecreto/shared';

/**
 * Notificaciones push con Expo (https://docs.expo.dev/push-notifications/sending-notifications/).
 *
 * Cada notificación de la campana también sale como push a los teléfonos del usuario, salvo que:
 *  - la cuenta esté desactivada o tenga `notifyPush` apagado;
 *  - sea de comentarios o chat y tenga `notifyComments` apagado;
 *  - sea un recordatorio y estemos en horas de descanso (se queda solo en la campana).
 * Los tokens que Expo reporta como no registrados se borran.
 */

export interface PushSource {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  kind: NotificationKind;
  target: NotificationTarget;
  title: string;
  body: string;
  group?: Types.ObjectId;
  wish?: Types.ObjectId;
}

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string | null>;
  sound: 'default';
  channelId: string;
  priority: 'high';
  badge?: number;
}

/** Lo enviado con transport 'log' (tests y depuración) */
export const pushLog: ExpoPushMessage[] = [];
const PUSH_LOG_MAX = 500;
const CHUNK = 100;
/** Canal de Android que crea la app (debe coincidir con el de la app) */
export const ANDROID_CHANNEL_ID = 'default';

const COMMENT_KINDS: ReadonlySet<NotificationKind> = new Set<NotificationKind>(['comment', 'reply', 'chat']);

/** Hora local (0–23) en la zona configurada */
function localHour(now: Date): number {
  const h = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: config.push.timezone }).format(now);
  return Number(h) % 24;
}

export function isQuietHours(now: Date = new Date()): boolean {
  const h = localHour(now);
  const { quietStartHour: start, quietEndHour: end } = config.push;
  return start > end ? h >= start || h < end : h >= start && h < end;
}

type ExpoTicket = { status: 'ok'; id: string } | { status: 'error'; message?: string; details?: { error?: string } };

async function postToExpo(messages: ExpoPushMessage[]): Promise<ExpoTicket[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(config.push.sendUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        ...(config.push.accessToken ? { Authorization: `Bearer ${config.push.accessToken}` } : {}),
      },
      body: JSON.stringify(messages),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[]; errors?: unknown } | null;
    if (!res.ok || !json?.data) {
      console.error('[push] Expo respondió con error:', res.status, JSON.stringify(json?.errors ?? json).slice(0, 500));
      return [];
    }
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

/** Envía mensajes ya armados (en bloques de 100) y borra los tokens que ya no existen */
export async function sendPushMessages(messages: ExpoPushMessage[]): Promise<{ sent: number; removed: number }> {
  if (messages.length === 0) return { sent: 0, removed: 0 };
  if (config.push.transport === 'log') {
    pushLog.push(...messages);
    if (pushLog.length > PUSH_LOG_MAX) pushLog.splice(0, pushLog.length - PUSH_LOG_MAX);
    return { sent: messages.length, removed: 0 };
  }
  let sent = 0;
  const dead: string[] = [];
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const tickets = await postToExpo(chunk).catch((error) => {
      console.error('[push] No se pudo contactar a Expo:', error);
      return [] as ExpoTicket[];
    });
    tickets.forEach((t, idx) => {
      if (t.status === 'ok') sent += 1;
      else if (t.details?.error === 'DeviceNotRegistered') dead.push(chunk[idx].to);
      else console.warn('[push] Ticket con error:', t.details?.error ?? t.message);
    });
  }
  if (dead.length) await PushToken.deleteMany({ token: { $in: dead } });
  return { sent, removed: dead.length };
}

/** Arma y envía la push de cada notificación recién creada en la campana */
export async function pushForNotifications(sources: PushSource[], now: Date = new Date()): Promise<number> {
  const quiet = isQuietHours(now);
  const list = sources.filter((s) => !(s.kind === 'reminder' && quiet));
  if (list.length === 0) return 0;

  const userIds = [...new Set(list.map((s) => String(s.user)))].map((id) => new Types.ObjectId(id));
  const [users, tokens, unread] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('active notifyPush notifyComments').lean(),
    PushToken.find({ user: { $in: userIds } }).select('user token').lean(),
    Notification.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { user: { $in: userIds }, readAt: null } },
      { $group: { _id: '$user', n: { $sum: 1 } } },
    ]),
  ]);
  if (tokens.length === 0) return 0;

  const prefs = new Map(users.map((u) => [String(u._id), u]));
  const tokensOf = new Map<string, string[]>();
  for (const t of tokens) {
    const key = String(t.user);
    tokensOf.set(key, [...(tokensOf.get(key) ?? []), t.token]);
  }
  const badge = new Map(unread.map((u) => [String(u._id), u.n]));

  const messages: ExpoPushMessage[] = [];
  for (const s of list) {
    const uid = String(s.user);
    const u = prefs.get(uid);
    if (!u || u.active === false || u.notifyPush === false) continue;
    if (COMMENT_KINDS.has(s.kind) && u.notifyComments === false) continue;
    for (const to of tokensOf.get(uid) ?? []) {
      messages.push({
        to,
        title: s.title,
        body: s.body,
        data: {
          notificationId: String(s._id),
          kind: s.kind,
          target: s.target,
          groupId: s.group ? String(s.group) : null,
          wishId: s.wish ? String(s.wish) : null,
        },
        sound: 'default',
        channelId: ANDROID_CHANNEL_ID,
        priority: 'high',
        badge: badge.get(uid) ?? 0,
      });
    }
  }
  const { sent } = await sendPushMessages(messages);
  return sent;
}
