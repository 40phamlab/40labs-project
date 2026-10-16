// [phase: 8D]
import * as React from 'react';

export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'var(--color-primary, #00A86B)',
  width = 60,
  height = 20,
}) => {
  if (!data || data.length < 2) {
    return <div className="w-[60px] h-[20px]" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = idx * stepX;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
