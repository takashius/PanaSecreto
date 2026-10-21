import type { ReactNode } from 'react';
import { Card } from 'antd';

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  icon: ReactNode;
  iconClassName?: string;
}

/** Tarjeta KPI: etiqueta, valor principal, detalle y variación */
export default function StatTile({ label, value, hint, delta, icon, iconClassName }: StatTileProps) {
  return (
    <Card className="rounded-2xl shadow-xs h-full [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl sm:text-3xl font-heading font-bold mt-1 text-gray-900 dark:text-gray-50 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
          {delta && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">{delta}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl hidden sm:flex items-center justify-center text-xl shrink-0 ${iconClassName ?? ''}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
