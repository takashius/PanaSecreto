import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { useTheme } from '@context/useTheme';
import { chartColor, gridColor } from './chartColors';
import { formatNumber } from '@utils/format';

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  tooltip?: string;
}

/**
 * Barras horizontales de una sola serie con valor rotulado directamente.
 * Cada fila completa es el área de hover (más grande que la barra).
 */
export default function BarList({ items, ariaLabel }: { items: BarListItem[]; ariaLabel: string }) {
  const { isDarkMode } = useTheme();
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {items.map((item) => {
        const pct = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <Tooltip key={item.key} title={item.tooltip ?? `${formatNumber(item.value)} (${pct}%)`} placement="topLeft">
            <li className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 cursor-default">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
              <span className="h-3 rounded-full block" style={{ background: gridColor(isDarkMode) }}>
                <span
                  className="h-3 rounded-full block transition-all"
                  style={{
                    width: item.value ? `${Math.max(2, (item.value / max) * 100)}%` : 0,
                    background: chartColor(isDarkMode),
                  }}
                />
              </span>
              <span className="text-sm font-semibold text-right tabular-nums text-gray-900 dark:text-gray-100">
                {formatNumber(item.value)}
              </span>
            </li>
          </Tooltip>
        );
      })}
    </ul>
  );
}
