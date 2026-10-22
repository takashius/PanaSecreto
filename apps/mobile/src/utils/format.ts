/** Formatos de presentación compartidos por las pantallas */

const CURRENCY_SYMBOL = { USD: '$', VES: 'Bs.' } as const;

/** "$10 – $25", "Hasta $25", "Desde Bs. 450" o "Sin límite" */
export function formatBudget(currency: 'USD' | 'VES', min: number | null, max: number | null): string {
  const s = CURRENCY_SYMBOL[currency];
  const n = (v: number) => `${s}${currency === 'VES' ? ' ' : ''}${v.toLocaleString('es-VE')}`;
  if (min != null && max != null) return `${n(min)} – ${n(max)}`;
  if (max != null) return `Hasta ${n(max)}`;
  if (min != null) return `Desde ${n(min)}`;
  return 'Sin límite';
}

/** Enlace público para unirse con un código de invitación */
export const inviteLink = (code: string) => `https://entrepanas.app/join/${encodeURIComponent(code)}`;

/** "ahora", "hace 5 min", "hace 3 h", "hace 1 día", "hace 2 días", o la fecha corta si pasó más de una semana */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? 'hace 1 día' : `hace ${d} días`;
  return new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

/** Hora o día corto para listas de chat: "10:45", "Ayer", "dom", "24 dic" */
export function chatTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Ayer';
  if (days < 7) return d.toLocaleDateString('es-VE', { weekday: 'short' });
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

/** Días completos que faltan hasta una fecha (0 si ya pasó) */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}
