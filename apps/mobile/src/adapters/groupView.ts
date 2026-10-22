import type { ApiGroupMember, GroupBundle } from '../api/groupDetail';
import type { GroupDetailView, GroupExclusionPreview, GroupMemberPreview, WishCategory, WishPreview } from '../types/session';
import { exchangeLabels, timeAgo } from '../utils/format';

const CATEGORIES: WishCategory[] = ['ropa', 'tecnologia', 'hogar', 'libros', 'dulces', 'otro'];

const fullName = (p: { name?: string; lastName?: string }) => [p.name, p.lastName].filter(Boolean).join(' ') || 'Pana';
export const initialsOf = (p: { name?: string; lastName?: string }) =>
  [p.name, p.lastName]
    .filter(Boolean)
    .map((x) => String(x).trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || '?';

function memberPreview(m: ApiGroupMember, myId: string, waiting: boolean): GroupMemberPreview {
  const isOrganizer = m.role === 'CREATOR';
  const joined = `Se unió ${timeAgo(m.joinedAt)}`;
  const alias = waiting ? (m.hasAlias ? ' · alias listo' : ' · sin alias') : '';
  return {
    id: m.userId,
    fullname: m.nickname ? `${fullName(m)} («${m.nickname}»)` : fullName(m),
    initials: initialsOf(m),
    subtitle: `${isOrganizer ? 'Organiza' : joined}${alias}`,
    isMe: m.userId === myId,
    isOrganizer,
  };
}

/** Exclusiones (solo las ve el organizador) como parejas: A ↔ B */
function exclusionPairs(members: ApiGroupMember[]): GroupExclusionPreview[] {
  const byId = new Map(members.map((m) => [m.userId, m]));
  const seen = new Set<string>();
  const pairs: GroupExclusionPreview[] = [];
  for (const m of members) {
    for (const other of m.exclusions ?? []) {
      const key = [m.userId, other].sort().join(':');
      if (seen.has(key) || !byId.has(other)) continue;
      seen.add(key);
      pairs.push({ id: key, a: byId.get(m.userId)!.name, b: byId.get(other)!.name, aId: m.userId, bId: other });
    }
  }
  return pairs;
}

/** Convierte la respuesta de la API en la vista que ya usan las pantallas del grupo */
export function toGroupDetailView(bundle: GroupBundle, myId: string): GroupDetailView {
  const { group: g, assignment, assignedWishes, reveal } = bundle;
  const labels = exchangeLabels(g.exchangeDate);
  const waiting = g.status === 'WAITING';
  const members = [...g.members]
    .sort((a, b) => Number(b.role === 'CREATOR') - Number(a.role === 'CREATOR') || Number(b.userId === myId) - Number(a.userId === myId))
    .map((m) => memberPreview(m, myId, waiting));

  const wishes: WishPreview[] = assignedWishes.map((w) => ({
    id: w.id,
    title: w.title,
    price: w.estimatedPrice,
    currency: w.currency ?? g.currency,
    category: CATEGORIES.includes(w.category as WishCategory) ? (w.category as WishCategory) : 'otro',
    imageUrl: w.imageUrl ?? null,
    note: w.description ?? null,
    commentsCount: w.commentsCount ?? 0,
  }));

  return {
    id: g.id,
    emoji: g.emoji || '🎁',
    name: g.name,
    status: g.status,
    organizerName: g.creatorName,
    isOrganizer: g.isCreator,
    exchangeDateLabel: labels.dateLabel,
    exchangeTimeLabel: labels.timeLabel,
    exchangeDateLong: labels.dateLong,
    exchangeAt: g.exchangeDate,
    currency: g.currency,
    budgetMin: g.budgetMin,
    budgetMax: g.budgetMax,
    maxMembers: g.maxParticipants,
    inviteCode: g.inviteCode,
    location: g.location,
    note: g.note,
    members,
    membersCount: g.memberCount,
    exclusions: g.isCreator ? exclusionPairs(g.members) : [],
    unreadChat: 0,
    envelope: assignment
      ? {
          alias: `${assignment.receiver.aliasEmoji} ${assignment.receiver.alias}`.trim(),
          revealedName: assignment.revealed ? fullName(assignment.receiver) : null,
          exchangeAt: g.exchangeDate,
          exchangeDateLong: labels.dateLong,
          wishes,
        }
      : null,
    envelopeOpened: g.envelopeOpened || Boolean(assignment?.opened),
    reveal: reveal
      ? {
          giftedTo: { fullname: fullName(reveal.giftedTo), alias: reveal.giftedTo.alias, initials: initialsOf(reveal.giftedTo) },
          giftedBy: { fullname: fullName(reveal.giftedBy), initials: initialsOf(reveal.giftedBy) },
        }
      : null,
  };
}
