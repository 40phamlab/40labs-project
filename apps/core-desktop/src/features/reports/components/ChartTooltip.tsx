import * as React from 'react';
import { formatCurrency } from '../config/reportCategories';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-surface-elevated border border-border rounded-md p-3 shadow-md min-w-[180px] text-xs font-ui">
      {label && <div className="font-semibold text-text-secondary mb-1.5">{label}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const color = entry.color || entry.stroke || entry.fill || '#16A34A';
          const name = entry.name || entry.dataKey;
          const val = entry.value;
          const isTzs = typeof val === 'number' && val > 1000;
          const formattedVal = isTzs ? formatCurrency(val) : (typeof val === 'number' ? val.toLocaleString() : val);

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-text-primary truncate">{name}</span>
              </div>
              <span className="font-mono font-bold text-text-primary">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
