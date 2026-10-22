// [PHASE: marketplace-preview — Availability helper]
import { Day } from '@40labs/types';

export interface OpenStatus {
  isOpen: boolean;
  label: string;
  tooltip: string;
}

const DAY_MAP: Record<string, Day> = {
  Sun: 'SUN',
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
};

export function calculateOpenNow(availability: { openTime: string; closeTime: string; days: Day[] }): OpenStatus {
  const { openTime, closeTime, days } = availability;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Dar_es_Salaam',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutePart = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const currentDay = DAY_MAP[weekdayPart] || 'MON';
    const currentMinutes = hourPart * 60 + minutePart;

    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    const isDayOpen = days.includes(currentDay);
    const isTimeOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

    const isOpen = isDayOpen && isTimeOpen;
    const tooltip = `Hours: ${openTime} - ${closeTime} (EAT)`;

    return {
      isOpen,
      label: isOpen ? 'Open now' : 'Closed',
      tooltip,
    };
  } catch {
    const tooltip = `Hours: ${openTime} - ${closeTime}`;
    return { isOpen: true, label: 'Open now', tooltip };
  }
}
