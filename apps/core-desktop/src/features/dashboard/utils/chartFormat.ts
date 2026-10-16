// [phase: 8D] Chart Formatting Utilities
import { getDeltaState } from '../components/DeltaChip';

export function formatCompactNumber(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}K`;
  }
  return `${sign}${abs}`;
}

const SW_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatXAxisDate(dateStr: string): string {
  if (!dateStr) return '';
  // If already formatted like '15 Okt', return as is
  if (/^\d{1,2}\s+[A-Za-z]+$/.test(dateStr)) return dateStr;

  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length < 3) return dateStr;

  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10);

  if (isNaN(day) || isNaN(monthIdx) || monthIdx < 1 || monthIdx > 12) {
    return dateStr;
  }

  const monthName = SW_MONTHS[monthIdx - 1];
  return `${day} ${monthName}`;
}

export function calculateXAxisInterval(range: '7d' | '30d' | '90d'): number {
  switch (range) {
    case '7d':
      return 0; // Every tick
    case '30d':
      return 4; // Every 5 days
    case '90d':
      return 14; // Every 15 days
    default:
      return 0;
  }
}

export function formatMetricUnit(metric: string): string {
  switch (metric) {
    case 'sales':
    case 'profit':
    case 'stock':
    case 'stock_value':
      return '(TZS)';
    case 'customers':
      return '(Idadi)';
    default:
      return '';
  }
}

export function formatTooltipValue(val: number, metric: string): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  if (metric === 'customers') {
    return `${safeVal.toLocaleString('en-US')}`;
  }
  return `TZS ${safeVal.toLocaleString('en-US')}`;
}

export interface PointDeltaResult {
  pct: number | null;
  direction: 'up' | 'down' | 'flat';
  symbol: string;
  formattedPct: string;
  state: 'good' | 'bad' | 'flat';
}

export function calculatePointDelta(
  currentVal: number,
  prevVal: number | null | undefined,
  polarity: 'up-good' | 'down-good' = 'up-good'
): PointDeltaResult {
  if (prevVal === null || prevVal === undefined || !Number.isFinite(prevVal) || prevVal === 0) {
    return {
      pct: null,
      direction: 'flat',
      symbol: '—',
      formattedPct: '—',
      state: 'flat',
    };
  }

  const diff = currentVal - prevVal;
  if (diff === 0) {
    return {
      pct: 0,
      direction: 'flat',
      symbol: '',
      formattedPct: '0%',
      state: 'flat',
    };
  }

  const pct = Math.round((diff / Math.abs(prevVal)) * 100);
  const direction: 'up' | 'down' = pct > 0 ? 'up' : 'down';
  const symbol = direction === 'up' ? '▲ ' : '▼ ';
  const state = getDeltaState({ pct, direction, polarity, compareKey: 'vs_yesterday' });

  return {
    pct,
    direction,
    symbol,
    formattedPct: `${symbol}${Math.abs(pct)}%`,
    state,
  };
}
