import { colors } from '@40labs/design-tokens';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (value: any, name: string, item: any) => [string | number, string | number];
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-[#1A221E] border border-[#28362E] rounded-md p-3 shadow-xl text-[#F8FAFB] text-xs font-ui"
      style={{ minWidth: 130 }}
    >
      {label !== undefined && label !== null && (
        <div className="font-bold text-[#CBD5E1] mb-1.5 pb-1 border-b border-[#243029]">
          {String(label)}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, index) => {
          const name = entry.name || entry.dataKey;
          const value = entry.value;
          const color = entry.color || entry.fill || entry.stroke || colors.primary;

          const formatted = formatter ? formatter(value, name, entry) : [value, name];

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[#94A3B8] capitalize">{String(formatted[1])}</span>
              </div>
              <span className="font-mono font-semibold text-[#F8FAFB]">{String(formatted[0])}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
