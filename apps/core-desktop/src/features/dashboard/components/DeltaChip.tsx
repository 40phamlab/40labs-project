// [phase: 8D] DeltaChip Component
import * as React from 'react';
import type { KpiDelta } from '@40labs/types';

export interface DeltaChipProps {
  delta?: KpiDelta;
  className?: string;
}

export function getDeltaState(delta?: KpiDelta): 'good' | 'bad' | 'flat' {
  if (!delta) return 'flat';
  const { pct, direction, polarity } = delta;
  if (direction === 'flat' || pct === null || pct === undefined) return 'flat';

  if (polarity === 'up-good') {
    return direction === 'up' ? 'good' : 'bad';
  } else {
    // down-good
    return direction === 'down' ? 'good' : 'bad';
  }
}

export const DeltaChip: React.FC<DeltaChipProps> = ({ delta, className = '' }) => {
  const state = getDeltaState(delta);

  let text = '—';
  let symbol = '';

  if (delta && delta.pct !== null && delta.pct !== undefined && Number.isFinite(delta.pct)) {
    if (delta.direction === 'up') symbol = '▲ ';
    else if (delta.direction === 'down') symbol = '▼ ';
    text = `${symbol}${Math.abs(delta.pct)}%`;
  } else if (delta?.direction === 'up') {
    text = '▲';
  } else if (delta?.direction === 'down') {
    text = '▼';
  }

  const colorClasses =
    state === 'good'
      ? 'bg-success-bg/80 text-success border-success-border/50'
      : state === 'bad'
      ? 'bg-danger-bg/80 text-danger border-danger-border/50'
      : 'bg-surface-secondary/50 text-text-muted border-border/30';

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] border text-[10px] font-bold font-mono leading-none tracking-tight select-none shrink-0 ${colorClasses} ${className}`}
    >
      {text}
    </span>
  );
};
