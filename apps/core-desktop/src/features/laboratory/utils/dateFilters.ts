export type LabDatePeriod = 'today' | 'week' | 'month';

/**
 * Lab list periods use the device's local timezone: today is local midnight to
 * tomorrow (exclusive), week is Monday midnight to next Monday (exclusive),
 * and month is the first local day to the first day of next month (exclusive).
 * Invalid and future timestamps do not belong to a bounded period.
 */
export function isInLabDatePeriod(value: string, period: LabDatePeriod, now = new Date()): boolean {
  const timestamp = new Date(value).getTime();
  const nowTimestamp = now.getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(nowTimestamp) || timestamp > nowTimestamp) return false;

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (period === 'month') {
    start.setDate(1);
  }
  const end = new Date(start);
  if (period === 'month') end.setMonth(end.getMonth() + 1);
  else if (period === 'week') end.setDate(end.getDate() + 7);
  else end.setDate(end.getDate() + 1);

  return timestamp >= start.getTime() && timestamp < end.getTime();
}

export function formatLabTimestamp(value: string, withTime = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Invalid date';
  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
}
