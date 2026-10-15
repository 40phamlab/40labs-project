import * as React from 'react';

export function getInitials(name: string): string {
  if (!name) return '??';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCounterpartyTone(type?: string): 'primary' | 'accent' | 'danger' | 'neutral' {
  switch (type) {
    case 'customer':
      return 'primary';
    case 'business':
      return 'accent';
    case 'gov':
      return 'accent';
    case 'marketing':
      return 'primary';
    case 'system':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export interface NotificationAvatarProps {
  name: string;
  counterpartyType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
};

const toneClasses: Record<'primary' | 'accent' | 'danger' | 'neutral', string> = {
  primary: 'bg-primary/15 text-primary border border-primary/30',
  accent: 'bg-accent/15 text-accent border border-accent/30',
  danger: 'bg-danger/15 text-danger border border-danger/30',
  neutral: 'bg-panel-strong text-text-muted border border-border/40',
};

export const NotificationAvatar: React.FC<NotificationAvatarProps> = ({
  name,
  counterpartyType,
  size = 'md',
  className = '',
}) => {
  const tone = getCounterpartyTone(counterpartyType);
  const initials = getInitials(name);

  return (
    <div
      className={`
        relative shrink-0 flex items-center justify-center rounded-full font-bold select-none elevation-raised
        ${toneClasses[tone]} ${sizeClasses[size]} ${className}
      `}
    >
      <span>{initials}</span>
    </div>
  );
};
