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
  default: 'text-text',
  primary: 'text-primary',
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
    <div className={`bg-panel rounded-card p-4 elevation-raised border border-border/50 flex flex-col gap-1 text-text relative overflow-hidden group ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-ui text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</span>
        <div className="text-text-muted group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={['font-mono text-2xl font-bold', toneClasses[tone]].join(' ')}>
          {displayValue}
        </span>
        {trendPercentage !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trendDirection === 'up' ? 'text-primary' : 'text-danger'}`}>
            {trendDirection === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendPercentage}%
          </div>
        )}
      </div>

      {(subtext) && <span className="font-ui text-[10px] text-text-muted mt-1">{subtext}</span>}

      {/* Subtle background tone hint */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-20 ${
        tone === 'primary' ? 'bg-primary' : tone === 'accent' ? 'bg-accent' : tone === 'danger' ? 'bg-danger' : 'bg-transparent'
      }`} />
    </div>
  );
}
