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
