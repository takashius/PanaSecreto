import { Types } from 'mongoose';
import { GroupStatusEnum, type GroupMessageView, type SendGroupMessageDTO } from '@panasecreto/shared';
import { ChatMessage, ChatReadState, IChatMessage } from './model';
import { Group } from '../group/model';
import { findGroupForMember } from '../group/store';
import { notifyChatClue } from '../../services/notifications';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });
const groupNotFound = () => fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');

/** Máximo de mensajes por usuario por minuto (antispam) */
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;
const HISTORY_DEFAULT = 50;
const HISTORY_MAX = 100;

export const roomOf = (groupId: string) => `group:${groupId}`;

const isReadOnly = (status: string) => status === GroupStatusEnum.REVEALED || status === GroupStatusEnum.COMPLETED;

/* ---------- Difusión en tiempo real (la registra el servidor de sockets) ---------- */

type Broadcaster = (groupId: string, message: GroupMessageView) => void;
let broadcaster: Broadcaster | null = null;

export function setChatBroadcaster(fn: Broadcaster | null): void {
  broadcaster = fn;
}

/** Vista pública del mensaje: nunca incluye el usuario real */
function toView(m: Pick<IChatMessage, '_id' | 'group' | 'user' | 'alias' | 'aliasEmoji' | 'text' | 'kind' | 'createdAt'>, viewerId?: string): GroupMessageView {
  return {
    id: String(m._id),
    groupId: String(m.group),
    alias: m.alias,
    aliasEmoji: m.aliasEmoji,
    text: m.text,
    kind: m.kind,
    ...(viewerId ? { mine: String(m.user) === viewerId } : {}),
    createdAt: m.createdAt,
  };
}

/** Verifica membresía para unirse a la sala del grupo */
export async function chatAccess(userId: string, groupId: string) {
  const group = await findGroupForMember(groupId, userId);
  if (!group) return null;
  const me = group.members.find((m) => String(m.user) === userId);
  return {
    group,
    readOnly: isReadOnly(group.status),
    myAlias: me?.alias ?? null,
    myAliasEmoji: me?.aliasEmoji ?? null,
  };
}

export async function getHistory(userId: string, groupId: string, query: { before?: unknown; limit?: unknown }): Promise<StoreResponse> {
  try {
    const access = await chatAccess(userId, groupId);
    if (!access) return groupNotFound();
    const limit = Math.max(1, Math.min(HISTORY_MAX, Number(query.limit) || HISTORY_DEFAULT));
    const filter: Record<string, unknown> = { group: access.group._id };
    if (typeof query.before === 'string' && query.before) {
      const before = Types.ObjectId.isValid(query.before)
        ? (await ChatMessage.findById(query.before).select('createdAt').lean())?.createdAt
        : new Date(query.before);
      if (before && !Number.isNaN(new Date(before).getTime())) filter.createdAt = { $lt: before };
    }
    const page = await ChatMessage.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
    const hasMore = page.length > limit;
    const results = page.slice(0, limit).reverse().map((m) => toView(m, userId));
    return {
      status: 200,
      message: {
        results,
        hasMore,
        readOnly: access.readOnly,
        myAlias: access.myAlias,
        myAliasEmoji: access.myAliasEmoji,
        cluesEnabled: Boolean(access.group.anonymousClues),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar el chat.', detail: error };
  }
}

/** Envía un mensaje (REST o socket). Devuelve la vista con `mine: true` y la difunde a la sala. */
export async function sendMessage(userId: string, groupId: string, dto: SendGroupMessageDTO): Promise<StoreResponse> {
  try {
    const access = await chatAccess(userId, groupId);
    if (!access) return groupNotFound();
    const { group } = access;
    if (access.readOnly) {
      return fail(409, 'CHAT_READ_ONLY', 'El chat se cerró con el destape: ya solo se puede leer.');
    }
    if (!access.myAlias) {
      return fail(409, 'ALIAS_REQUIRED', 'Elige tu alias antes de escribir en el chat.');
    }
    if (dto.kind === 'pista') {
      if (!group.anonymousClues) return fail(409, 'CLUES_DISABLED', 'Este grupo no tiene activadas las pistas anónimas.');
      if (group.status !== GroupStatusEnum.LOCKED) {
        return fail(409, 'NOT_DRAWN_YET', 'Las pistas se pueden enviar después del sorteo.');
      }
    }
    const uid = new Types.ObjectId(userId);
    const recent = await ChatMessage.countDocuments({ user: uid, createdAt: { $gt: new Date(Date.now() - 60_000) } });
    if (recent >= CHAT_RATE_LIMIT_PER_MINUTE) {
      return fail(429, 'CHAT_RATE_LIMITED', 'Vas muy rápido, mi pana. Espera un momentico.');
    }

    const created = await ChatMessage.create({
      group: group._id,
      user: uid,
      alias: access.myAlias,
      aliasEmoji: access.myAliasEmoji || '🎁',
      text: dto.text,
      kind: dto.kind,
    });
    // Quien envía ya leyó hasta su propio mensaje
    await ChatReadState.updateOne(
      { group: group._id, user: uid },
      { $max: { lastReadAt: created.createdAt } },
      { upsert: true }
    );

    broadcaster?.(groupId, toView(created));
    if (dto.kind === 'pista') {
      notifyChatClue({
        groupId,
        groupName: group.name,
        senderId: userId,
        alias: access.myAlias,
        memberIds: group.members.map((m) => String(m.user)),
      });
    }
    return { status: 201, message: toView(created, userId) };
  } catch (error) {
    return { status: 500, message: 'Error al enviar el mensaje.', detail: error };
  }
}

export async function markRead(userId: string, groupId: string): Promise<StoreResponse> {
  try {
    const access = await chatAccess(userId, groupId);
    if (!access) return groupNotFound();
    const now = new Date();
    await ChatReadState.updateOne(
      { group: access.group._id, user: new Types.ObjectId(userId) },
      { $max: { lastReadAt: now } },
      { upsert: true }
    );
    return { status: 200, message: { ok: true, lastReadAt: now } };
  } catch (error) {
    return { status: 500, message: 'Error al marcar el chat como leído.', detail: error };
  }
}

/**
 * Lista de chats del usuario (pantalla Chats): un chat por grupo con último mensaje y no leídos.
 */
export async function listChats(userId: string): Promise<StoreResponse> {
  try {
    const uid = new Types.ObjectId(userId);
    const groups = await Group.find({ 'members.user': uid })
      .select('name emoji status exchangeDate members.user members.alias members.aliasEmoji')
      .lean();
    const ids = groups.map((g) => g._id);
    const [reads, lastMessages] = await Promise.all([
      ChatReadState.find({ user: uid, group: { $in: ids } }).lean(),
      ChatMessage.aggregate<{ _id: Types.ObjectId; last: IChatMessage }>([
        { $match: { group: { $in: ids } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$group', last: { $first: '$$ROOT' } } },
      ]),
    ]);
    const readMap = new Map(reads.map((r) => [String(r.group), r.lastReadAt]));
    const lastMap = new Map(lastMessages.map((l) => [String(l._id), l.last]));
    const unreadCounts = await Promise.all(
      groups.map((g) =>
        ChatMessage.countDocuments({
          group: g._id,
          user: { $ne: uid },
          ...(readMap.get(String(g._id)) ? { createdAt: { $gt: readMap.get(String(g._id)) } } : {}),
        })
      )
    );
    const results = groups
      .map((g, i) => {
        const me = g.members.find((m) => String(m.user) === userId);
        const last = lastMap.get(String(g._id));
        return {
          groupId: String(g._id),
          name: g.name,
          emoji: g.emoji,
          status: g.status,
          exchangeDate: g.exchangeDate,
          memberCount: g.members.length,
          readOnly: isReadOnly(g.status),
          myAlias: me?.alias ?? null,
          myAliasEmoji: me?.aliasEmoji ?? null,
          unread: unreadCounts[i],
          lastMessage: last ? toView(last, userId) : null,
        };
      })
      .sort((a, b) => {
        const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return tb - ta;
      });
    return { status: 200, message: { results, totalUnread: unreadCounts.reduce((a, b) => a + b, 0) } };
  } catch (error) {
    return { status: 500, message: 'Error al consultar tus chats.', detail: error };
  }
}
