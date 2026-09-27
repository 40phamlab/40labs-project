import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from '../types';
import { ChartTooltip } from '../ChartTooltip';

export interface AreaChartRendererProps extends Omit<ChartProps, 'onDataClick'> {
  resolvedSeries: ChartSeries[];
  resolvedXAxisKey: string;
  palette: string[];
  onDataClick?: (dataPoint: any, index: number) => void;
}

export function AreaChartRenderer({
  data,
  resolvedSeries,
  resolvedXAxisKey,
  height = 300,
  width = '100%',
  showTooltip = true,
  showLegend = true,
  showGrid = true,
  palette,
  onDataClick,
  stacked = false,
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
}: AreaChartRendererProps) {
  const containerHeight = typeof height === 'number' ? height : Number(height) || 300;

  return (
    <ResponsiveContainer width={width as any} height={containerHeight}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.borderSubtle}
            opacity={0.6}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={resolvedXAxisKey}
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
          tickLine={{ stroke: colors.borderDefault }}
          axisLine={{ stroke: colors.borderDefault }}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
          tickLine={{ stroke: colors.borderDefault }}
          axisLine={{ stroke: colors.borderDefault }}
          tickFormatter={yAxisFormatter}
        />
        {showTooltip && <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter', color: colors.textSecondary }}
          />
        )}
        {resolvedSeries.map((s, idx) => {
          const strokeColor = s.color || palette[idx % palette.length];
          const fillColor = s.fill || strokeColor;
          return (
            <Area
              key={`area-${s.dataKey}`}
              type={s.type || 'monotone'}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.25}
              strokeWidth={s.strokeWidth || 2}
              stackId={stacked ? 'stack' : undefined}
              onClick={(props: any) => {
                if (onDataClick && props && props.payload) {
                  const dataIndex = data.findIndex((d) => d[resolvedXAxisKey] === props.payload[resolvedXAxisKey]);
                  onDataClick(props.payload, dataIndex !== -1 ? dataIndex : 0);
                }
              }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
