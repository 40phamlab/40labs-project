// [phase: 8D] Chart Formatting Utilities Unit Tests
import { describe, test, expect } from 'vitest';
import {
  formatCompactNumber,
  formatXAxisDate,
  calculateXAxisInterval,
  formatMetricUnit,
  calculatePointDelta,
} from './chartFormat';

describe('Chart Formatting Utilities [phase: 8D]', () => {
  test('formatCompactNumber handles large numbers and zero without NaN', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(500)).toBe('500');
    expect(formatCompactNumber(1200)).toBe('1.2K');
    expect(formatCompactNumber(18000)).toBe('18K');
    expect(formatCompactNumber(500000)).toBe('500K');
    expect(formatCompactNumber(1200000)).toBe('1.2M');
    expect(formatCompactNumber(15000000)).toBe('15M');
    expect(formatCompactNumber(-18000)).toBe('-18K');
    expect(formatCompactNumber(NaN)).toBe('0');
  });

  test('formatXAxisDate formats ISO date to Swahili day and month', () => {
    expect(formatXAxisDate('2026-10-15')).toBe('15 Okt');
    expect(formatXAxisDate('2026-01-05')).toBe('5 Jan');
    expect(formatXAxisDate('2026-05-20')).toBe('20 Mei');
    expect(formatXAxisDate('15 Okt')).toBe('15 Okt'); // already formatted
  });

  test('calculateXAxisInterval returns correct tick spacing for range', () => {
    expect(calculateXAxisInterval('7d')).toBe(0);
    expect(calculateXAxisInterval('30d')).toBe(4);
    expect(calculateXAxisInterval('90d')).toBe(14);
  });

  test('formatMetricUnit returns expected unit in parentheses', () => {
    expect(formatMetricUnit('sales')).toBe('(TZS)');
    expect(formatMetricUnit('profit')).toBe('(TZS)');
    expect(formatMetricUnit('stock')).toBe('(TZS)');
    expect(formatMetricUnit('customers')).toBe('(Idadi)');
  });

  test('calculatePointDelta computes percentage and direction correctly', () => {
    const upDelta = calculatePointDelta(1500, 1000, 'up-good');
    expect(upDelta.pct).toBe(50);
    expect(upDelta.direction).toBe('up');
    expect(upDelta.state).toBe('good');
    expect(upDelta.formattedPct).toBe('▲ 50%');

    const downDelta = calculatePointDelta(800, 1000, 'up-good');
    expect(downDelta.pct).toBe(-20);
    expect(downDelta.direction).toBe('down');
    expect(downDelta.state).toBe('bad');
    expect(downDelta.formattedPct).toBe('▼ 20%');

    const flatDelta = calculatePointDelta(1000, 0, 'up-good');
    expect(flatDelta.pct).toBeNull();
    expect(flatDelta.formattedPct).toBe('—');
  });
});
