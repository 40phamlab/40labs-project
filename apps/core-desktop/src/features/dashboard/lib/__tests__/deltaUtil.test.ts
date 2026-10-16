// [phase: 8D]
import { describe, it, expect } from 'vitest';
import { calculatePctDelta, buildKpiDelta } from '../deltaUtil';

describe('deltaUtil [phase: 8D]', () => {
  it('returns null when prev === 0', () => {
    expect(calculatePctDelta(100, 0)).toBeNull();
    const delta = buildKpiDelta(100, 0, 'up-good', 'vs_yesterday');
    expect(delta.pct).toBeNull();
    expect(delta.direction).toBe('up');
  });

  it('calculates positive delta correctly', () => {
    expect(calculatePctDelta(150, 100)).toBe(50);
    const delta = buildKpiDelta(150, 100, 'up-good', 'vs_yesterday');
    expect(delta.pct).toBe(50);
    expect(delta.direction).toBe('up');
    expect(delta.polarity).toBe('up-good');
  });

  it('calculates negative delta correctly', () => {
    expect(calculatePctDelta(75, 100)).toBe(-25);
    const delta = buildKpiDelta(75, 100, 'down-good', 'vs_yesterday');
    expect(delta.pct).toBe(-25);
    expect(delta.direction).toBe('down');
    expect(delta.polarity).toBe('down-good');
  });

  it('handles negative base or target numbers safely', () => {
    expect(calculatePctDelta(-50, -100)).toBe(50);
    expect(calculatePctDelta(-150, -100)).toBe(-50);
    const delta = buildKpiDelta(-50, -100, 'down-good', 'vs_last_month');
    expect(delta.compareKey).toBe('vs_last_month');
    expect(delta.polarity).toBe('down-good');
  });

  it('handles flat values (cur === prev)', () => {
    expect(calculatePctDelta(100, 100)).toBe(0);
    const delta = buildKpiDelta(100, 100, 'up-good', 'vs_yesterday');
    expect(delta.pct).toBe(0);
    expect(delta.direction).toBe('flat');
  });

  it('guards against NaN and Infinity', () => {
    expect(calculatePctDelta(NaN, 100)).toBeNull();
    expect(calculatePctDelta(100, Infinity)).toBeNull();
    expect(calculatePctDelta(Infinity, 100)).toBeNull();
  });
});
