import i18n from '../locales/i18n';

const locale = () => (i18n.language?.startsWith('en') ? 'en-US' : 'es-VE');

export function formatDate(value?: string | Date | null, withTime = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = currency === 'VES' ? 'Bs.' : '$';
  return `${symbol} ${new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(amount)}`;
}

export function formatBudget(min: number | null, max: number | null, currency: string, noLimitLabel: string): string {
  if (min == null && max == null) return noLimitLabel;
  if (min != null && max != null) return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  if (max != null) return `≤ ${formatMoney(max, currency)}`;
  return `≥ ${formatMoney(min as number, currency)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale()).format(value);
}
