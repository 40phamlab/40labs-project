import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type KPITone = 'default' | 'primary' | 'accent' | 'danger';

export interface KPIFormattingOptions {
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export interface KPITileProps {
  title: string;
  value: string | number;
  tone?: KPITone;
  icon?: ReactNode;
  trendPercentage?: number;
  trendDirection?: 'up' | 'down';
  formatting?: KPIFormattingOptions;
  subtext?: string;
  className?: string;
}

const toneClasses: Record<KPITone, string> = {
  default: 'text-text-primary',
  primary: 'text-action-primary',
  accent: 'text-accent',
  danger: 'text-danger',
};

export function KPITile({
  title,
  value,
  tone = 'default',
  icon,
  trendPercentage,
  trendDirection,
  formatting,
  subtext,
  className = ''
}: KPITileProps) {
  const displayValue = typeof value === 'number'
    ? `${formatting?.prefix || ''}${value.toFixed(formatting?.decimals ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${formatting?.suffix || ''}`
    : value;

  return (
    <div className={`bg-panel rounded-card p-3.5 elevation-raised border border-border-default flex flex-col gap-1 text-text-primary relative overflow-hidden group ${className}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-ui text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</span>
        {icon && (
          <div className="text-text-muted group-hover:text-action-primary transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={['font-mono text-xl font-bold tracking-tight', toneClasses[tone]].join(' ')}>
          {displayValue}
        </span>
        {trendPercentage !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trendDirection === 'up' ? 'text-action-primary' : 'text-danger'}`}>
            {trendDirection === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendPercentage}%
          </div>
        )}
      </div>

      {subtext && <span className="font-ui text-[10px] text-text-muted mt-0.5 leading-snug">{subtext}</span>}

      {/* Subtle background tone hint */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-30 ${
        tone === 'primary' ? 'bg-action-primary' : tone === 'accent' ? 'bg-accent' : tone === 'danger' ? 'bg-danger' : 'bg-transparent'
      }`} />
    </div>
  );
}
