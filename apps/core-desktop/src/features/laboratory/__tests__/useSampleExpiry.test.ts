import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSampleExpiry, EXPIRING_SOON_RATIO } from '../hooks/useSampleExpiry';
import type { LabSample } from '@40labs/types';

describe('useSampleExpiry Hook & Boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns fresh when no expires_at is present', () => {
    const sample: LabSample = {
      id: 's1',
      workspace_id: 'ws',
      branch_id: 'br',
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
      lab_order_id: 'ord1',
      collected_by_user_id: 'u1',
      collected_at: '2026-03-01T10:00:00Z',
      sample_label: 'S1',
      status: 'collected',
      expires_at: null,
      expiry_source: null,
    };
    expect(useSampleExpiry(sample)).toBe('fresh');
  });

  it('returns expired when now >= expires_at', () => {
    vi.setSystemTime(new Date('2026-03-02T10:00:00Z'));
    const sample: LabSample = {
      id: 's1',
      workspace_id: 'ws',
      branch_id: 'br',
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
      lab_order_id: 'ord1',
      collected_by_user_id: 'u1',
      collected_at: '2026-03-01T10:00:00Z',
      sample_label: 'S1',
      status: 'collected',
      expires_at: '2026-03-02T09:00:00Z',
      expiry_source: 'catalog',
    };
    expect(useSampleExpiry(sample)).toBe('expired');
  });

  it('returns expiring_soon when remaining time / total window <= EXPIRING_SOON_RATIO (0.25)', () => {
    // Collected: 00:00, Expires: 10:00 (Total = 10 hours)
    // Now: 08:30 (Remaining = 1.5 hours. Ratio = 1.5 / 10 = 0.15 <= 0.25)
    vi.setSystemTime(new Date('2026-03-01T08:30:00Z'));
    const sample: LabSample = {
      id: 's1',
      workspace_id: 'ws',
      branch_id: 'br',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
      lab_order_id: 'ord1',
      collected_by_user_id: 'u1',
      collected_at: '2026-03-01T00:00:00Z',
      sample_label: 'S1',
      status: 'collected',
      expires_at: '2026-03-01T10:00:00Z',
      expiry_source: 'catalog',
    };
    expect(useSampleExpiry(sample)).toBe('expiring_soon');
  });

  it('returns fresh when remaining time / total window > EXPIRING_SOON_RATIO (0.25)', () => {
    // Collected: 00:00, Expires: 10:00 (Total = 10 hours)
    // Now: 02:00 (Remaining = 8 hours. Ratio = 8 / 10 = 0.8 > 0.25)
    vi.setSystemTime(new Date('2026-03-01T02:00:00Z'));
    const sample: LabSample = {
      id: 's1',
      workspace_id: 'ws',
      branch_id: 'br',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
      lab_order_id: 'ord1',
      collected_by_user_id: 'u1',
      collected_at: '2026-03-01T00:00:00Z',
      sample_label: 'S1',
      status: 'collected',
      expires_at: '2026-03-01T10:00:00Z',
      expiry_source: 'catalog',
    };
    expect(useSampleExpiry(sample)).toBe('fresh');
  });
});
