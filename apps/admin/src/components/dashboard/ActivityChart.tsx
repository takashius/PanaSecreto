import { useState } from 'react';
import { Button, Table, Tooltip } from 'antd';
import { BarChartOutlined, TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@context/useTheme';
import { chartColor, gridColor } from './chartColors';
import { formatDate, formatNumber } from '@utils/format';

interface Point {
  date: string; // YYYY-MM-DD
  value: number;
}

// Mediodía local para que la fecha no se corra por zona horaria al formatear
const toDate = (key: string) => new Date(`${key}T12:00:00`);

/**
 * Columnas diarias (una serie). Hover por columna con área completa,
 * eje recesivo (línea base + valor máximo) y vista de tabla accesible.
 */
export default function ActivityChart({ points, unitLabel }: { points: Point[]; unitLabel: string }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...points.map((p) => p.value));
  const color = chartColor(isDarkMode);

  const toggle = (
    <Button
      size="small"
      type="text"
      icon={asTable ? <BarChartOutlined /> : <TableOutlined />}
      onClick={() => setAsTable((v) => !v)}
      aria-pressed={asTable}
    >
      {asTable ? t('dashboard.showChart') : t('dashboard.showTable')}
    </Button>
  );

  if (asTable) {
    return (
      <div>
        <div className="flex justify-end mb-2">{toggle}</div>
        <Table
          size="small"
          rowKey="date"
          pagination={{ pageSize: 10, size: 'small' }}
          dataSource={[...points].reverse()}
          columns={[
            { title: t('dashboard.date'), dataIndex: 'date', render: (d: string) => formatDate(toDate(d)) },
            { title: t('dashboard.count'), dataIndex: 'value', align: 'right' as const },
          ]}
        />
      </div>
    );
  }

  const mid = Math.floor(points.length / 2);

  return (
    <div>
      <div className="flex justify-end mb-2">{toggle}</div>
      <div className="relative" role="img" aria-label={`${unitLabel}: ${points.map((p) => `${p.date} ${p.value}`).join(', ')}`}>
        {/* Valor máximo + línea guía recesiva */}
        <div className="absolute left-0 right-0 top-0 flex items-center gap-2 pointer-events-none">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">{formatNumber(max)}</span>
          <span className="flex-1 border-t border-dashed" style={{ borderColor: gridColor(isDarkMode) }} />
        </div>
        <div className="flex items-end h-40 pt-5 gap-[2px] border-b" style={{ borderColor: gridColor(isDarkMode) }}>
          {points.map((p) => (
            <Tooltip key={p.date} title={`${formatDate(toDate(p.date))}: ${formatNumber(p.value)} ${unitLabel}`} mouseEnterDelay={0}>
              <div className="flex-1 h-full flex items-end group cursor-default">
                <div
                  className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                  style={{ height: p.value ? `${Math.max(3, (p.value / max) * 100)}%` : 0, background: color }}
                />
              </div>
            </Tooltip>
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <span>{points[0] && formatDate(toDate(points[0].date))}</span>
          <span>{points[mid] && formatDate(toDate(points[mid].date))}</span>
          <span>{points.length > 0 && formatDate(toDate(points[points.length - 1].date))}</span>
        </div>
      </div>
    </div>
  );
}
