// [phase: 8D] Recharts-based 24px Sparkline
import * as React from 'react';
import { ResponsiveContainer, LineChart, Line } from '@40labs/ui-components';

export interface SparklineProps {
  data?: number[];
  state?: 'good' | 'bad' | 'flat';
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  state = 'good',
  className = '',
}) => {
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((v, i) => ({ i, v: Number.isFinite(v) ? v : 0 }));
  }, [data]);

  const strokeColor =
    state === 'good'
      ? '#16A34A'
      : state === 'bad'
      ? '#EF4444'
      : '#94A3B8';

  if (!chartData || chartData.length < 2) {
    return <div className={`h-[24px] w-[60px] ${className}`} />;
  }

  return (
    <div className={`h-[24px] w-[60px] overflow-hidden shrink-0 ${className}`}>
      <ResponsiveContainer width="100%" height={24}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
