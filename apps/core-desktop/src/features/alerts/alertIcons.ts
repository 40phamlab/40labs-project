import { Info, CircleAlert, TriangleAlert, OctagonAlert, Skull, type LucideIcon } from 'lucide-react';
import type { AlertSeverity } from '@40labs/types';

export const ALERT_SEVERITY_ICONS: Record<AlertSeverity, LucideIcon> = {
  info: Info,
  notice: CircleAlert,
  warning: TriangleAlert,
  danger: OctagonAlert,
  critical: Skull,
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, { text: string; bg: string; border: string }> = {
  info: { text: 'text-info', bg: 'bg-info/15', border: 'border-info' },
  notice: { text: 'text-info', bg: 'bg-info/15', border: 'border-info' },
  warning: { text: 'text-[#F97316]', bg: 'bg-[#F97316]/15', border: 'border-[#F97316]' },
  danger: { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/15', border: 'border-[#EF4444]' },
  critical: { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/25', border: 'border-[#EF4444]' },
};

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  notice: 2,
  warning: 3,
  danger: 4,
  critical: 5,
};
