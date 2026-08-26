// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/dashboard.md]
import { type ReactNode } from 'react';

export type KPITone = 'default' | 'primary' | 'accent' | 'danger';

export interface KPITileProps {
  label: string;
  value: string | number;
  tone?: KPITone;
  icon?: ReactNode;
  subtext?: string;
}

const toneClasses: Record<KPITone, string> = {
  default: 'text-black/80',
  primary: 'text-primary',
  accent: 'text-accent',
  danger: 'text-danger',
};

// Values that represent money or counts render in font-mono, per the
// typography token rule (prices/codes/batch IDs always monospace).
export function KPITile({ label, value, tone = 'default', icon, subtext }: KPITileProps) {
  return (
    <div className="bg-surface rounded-card p-4 elevation-raised flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-ui text-xs uppercase tracking-wide text-black/50">{label}</span>
        {icon}
      </div>
      <span className={['font-mono text-2xl font-semibold', toneClasses[tone]].join(' ')}>
        {value}
      </span>
      {subtext && <span className="font-ui text-xs text-black/40">{subtext}</span>}
    </div>
  );
}