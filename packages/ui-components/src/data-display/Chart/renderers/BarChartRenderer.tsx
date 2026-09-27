import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from '../types';
import { ChartTooltip } from '../ChartTooltip';

export interface BarChartRendererProps extends Omit<ChartProps, 'onDataClick'> {
  resolvedSeries: ChartSeries[];
  resolvedXAxisKey: string;
  palette: string[];
  onDataClick?: (dataPoint: any, index: number) => void;
}

export function BarChartRenderer({
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
  layout = 'horizontal',
  stacked = false,
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
}: BarChartRendererProps) {
  const containerHeight = typeof height === 'number' ? height : Number(height) || 300;

  return (
    <ResponsiveContainer width={width as any} height={containerHeight}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.borderSubtle}
            opacity={0.6}
            vertical={layout === 'vertical'}
            horizontal={layout === 'horizontal'}
          />
        )}
        {layout === 'horizontal' ? (
          <>
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
          </>
        ) : (
          <>
            <XAxis
              type="number"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
              tickFormatter={yAxisFormatter}
            />
            <YAxis
              dataKey={resolvedXAxisKey}
              type="category"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
              tickFormatter={xAxisFormatter}
            />
          </>
        )}
        {showTooltip && <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter', color: colors.textSecondary }}
          />
        )}
        {resolvedSeries.map((s, idx) => {
          const fillColor = s.color || s.fill || palette[idx % palette.length];
          return (
            <Bar
              key={`bar-${s.dataKey}`}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              fill={fillColor}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
              onClick={(props: any) => {
                if (onDataClick && props && props.payload) {
                  const dataIndex = data.findIndex((d) => d[resolvedXAxisKey] === props.payload[resolvedXAxisKey]);
                  onDataClick(props.payload, dataIndex !== -1 ? dataIndex : 0);
                }
              }}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
