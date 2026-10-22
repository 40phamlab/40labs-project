import type { LabSample } from '@40labs/types';

export const EXPIRING_SOON_RATIO = 0.25;

/**
 * Offline-first: fully local. Derivation uses the device clock.
 */
export type SampleExpiryStatus = 'fresh' | 'expiring_soon' | 'expired';

export function useSampleExpiry(sample: LabSample | null | undefined): SampleExpiryStatus {
  if (!sample || !sample.expires_at) return 'fresh';

  const now = new Date().getTime();
  const collected = new Date(sample.collected_at).getTime();
  const expires = new Date(sample.expires_at).getTime();

  if (now >= expires) {
    return 'expired';
  }

  const totalWindow = expires - collected;
  const remainingTime = expires - now;

  if (totalWindow <= 0) {
    return 'expired';
  }

  const ratio = remainingTime / totalWindow;
  if (ratio <= EXPIRING_SOON_RATIO) {
    return 'expiring_soon';
  }

  return 'fresh';
}
