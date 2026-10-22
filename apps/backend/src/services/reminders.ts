import { Types } from 'mongoose';
import { GroupStatusEnum } from '@panasecreto/shared';
import { Group } from '../components/group/model';
import { Wish } from '../components/wishlist/model';
import { insertInApp, type InAppItem } from './notifications';

const DAY = 864e5;

/**
 * Recordatorios en la app (idempotentes gracias a dedupeKey; se puede llamar cada hora):
 *  1. Faltan 3 días / 1 día para el intercambio (grupos sorteados).
 *  2. Sobre sin abrir 24 h después del sorteo.
 *  3. Lista de deseos vacía a 7 días o menos del intercambio.
 *  4. Sin alias a 7 días o menos del intercambio (antes del sorteo).
 */
export async function runReminders(now: Date = new Date()): Promise<number> {
  const items: InAppItem[] = [];
  const horizon = new Date(now.getTime() + 7 * DAY);
  const groups = await Group.find({
    status: { $in: [GroupStatusEnum.WAITING, GroupStatusEnum.LOCKED] },
    exchangeDate: { $gt: now, $lte: horizon },
  })
    .select('name emoji status exchangeDate drawnAt members.user members.alias members.envelopeOpenedAt')
    .lean();

  // También los sorteados hace más de un día con el intercambio más lejos (sobres sin abrir)
  const lockedLater = await Group.find({
    status: GroupStatusEnum.LOCKED,
    exchangeDate: { $gt: horizon },
    drawnAt: { $lte: new Date(now.getTime() - DAY) },
    'members.envelopeOpenedAt': { $exists: false },
  })
    .select('name emoji status exchangeDate drawnAt members.user members.alias members.envelopeOpenedAt')
    .lean();

  const all = [...groups, ...lockedLater];
  const wishOwners = new Set(
    (
      await Wish.aggregate<{ _id: { group: Types.ObjectId; user: Types.ObjectId } }>([
        { $match: { group: { $in: groups.map((g) => g._id) } } },
        { $group: { _id: { group: '$group', user: '$user' } } },
      ])
    ).map((w) => `${w._id.group}:${w._id.user}`)
  );

  for (const g of all) {
    const gid = String(g._id);
    const label = `${g.emoji ?? '🎁'} ${g.name}`;
    const msLeft = new Date(g.exchangeDate).getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / DAY);
    const withinWeek = msLeft <= 7 * DAY;

    for (const m of g.members) {
      const uid = String(m.user);

      if (g.status === GroupStatusEnum.LOCKED && msLeft <= 3 * DAY) {
        const bucket = msLeft <= DAY ? '1d' : '3d';
        items.push({
          userId: uid,
          kind: 'reminder',
          target: 'envelope',
          groupId: gid,
          title: bucket === '1d' ? '¡Mañana es el gran día! 🎁' : `Faltan ${daysLeft} días 🎄`,
          body:
            bucket === '1d'
              ? `El intercambio de «${g.name}» es mañana. ¿Ya tienes el regalo de tu pana?`
              : `Se acerca el intercambio de «${g.name}». ¡Pilas con ese regalo!`,
          dedupeKey: `reminder:exchange:${bucket}:${gid}:${uid}`,
        });
      }

      if (
        g.status === GroupStatusEnum.LOCKED &&
        !m.envelopeOpenedAt &&
        g.drawnAt &&
        new Date(g.drawnAt).getTime() <= now.getTime() - DAY
      ) {
        items.push({
          userId: uid,
          kind: 'reminder',
          target: 'envelope',
          groupId: gid,
          title: 'Tu sobre sigue cerrado ✉️',
          body: `Ábrelo pa’ ver a quién le regalas en «${g.name}».`,
          dedupeKey: `reminder:envelope:${gid}:${uid}`,
        });
      }

      if (withinWeek && !wishOwners.has(`${gid}:${uid}`)) {
        items.push({
          userId: uid,
          kind: 'reminder',
          target: 'group',
          groupId: gid,
          title: 'Tu lista de deseos está vacía 📝',
          body: `Ayuda a tu pana secreto: agrega deseos en ${label}.`,
          dedupeKey: `reminder:wishlist:${gid}:${uid}`,
        });
      }

      if (withinWeek && g.status === GroupStatusEnum.WAITING && !m.alias) {
        items.push({
          userId: uid,
          kind: 'reminder',
          target: 'group',
          groupId: gid,
          title: 'Elige tu alias 🥸',
          body: `En «${g.name}» todavía no tienes alias. Escoge uno antes del sorteo.`,
          dedupeKey: `reminder:alias:${gid}:${uid}`,
        });
      }
    }
  }
  return insertInApp(items);
}

/** Programa los recordatorios cada hora. Devuelve la función para detenerlos. */
export function scheduleReminders(intervalMs = 3600e3): () => void {
  const tick = () => runReminders().catch((error) => console.error('[reminders] Falló la ronda:', error));
  const first = setTimeout(tick, 60e3);
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  first.unref?.();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
