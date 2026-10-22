import type { GroupSummary } from '../api/groups';
import { daysUntil, exchangeLabels } from './format';

/** "El intercambio es hoy", "mañana", "en 4 días" o "ya pasó" */
export function exchangeCountdown(iso: string, now: number = Date.now()): string {
  const target = new Date(iso);
  const sameDay = new Date(now).toDateString() === target.toDateString();
  if (sameDay) return '¡El intercambio es hoy! 🎉';
  if (target.getTime() < now) return 'El intercambio ya pasó';
  const days = daysUntil(iso, now);
  return days === 1 ? 'El intercambio es mañana' : `El intercambio es en ${days} días`;
}

/** "Dic 2025" */
export function monthYear(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '');
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getFullYear()}`;
}

/** Orden del inicio: activos por fecha del intercambio; los finalizados al final (más recientes primero) */
export function sortGroups(groups: GroupSummary[]): GroupSummary[] {
  const time = (g: GroupSummary) => new Date(g.exchangeDate).getTime();
  return [...groups].sort((a, b) => {
    const doneA = a.status === 'COMPLETED';
    const doneB = b.status === 'COMPLETED';
    if (doneA !== doneB) return doneA ? 1 : -1;
    return doneA ? time(b) - time(a) : time(a) - time(b);
  });
}

export const shortExchangeDate = (iso: string) => {
  const { dateLabel, timeLabel } = exchangeLabels(iso);
  return `${dateLabel} · ${timeLabel}`;
};
