// [phase: 8D]
import type { KpiDelta, DeltaPolarity } from '@40labs/types';

export function calculatePctDelta(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  if (prev === 0) return null;

  const raw = ((cur - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(raw)) return null;

  return Math.round(raw * 10) / 10;
}

export function buildKpiDelta(
  cur: number,
  prev: number,
  polarity: DeltaPolarity = 'up-good',
  compareKey: 'vs_yesterday' | 'vs_last_month' = 'vs_yesterday'
): KpiDelta {
  const pct = calculatePctDelta(cur, prev);

  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (pct !== null) {
    if (pct > 0) direction = 'up';
    else if (pct < 0) direction = 'down';
  } else if (cur > prev) {
    direction = 'up';
  } else if (cur < prev) {
    direction = 'down';
  }

  return {
    pct,
    direction,
    polarity,
    compareKey,
  };
}
