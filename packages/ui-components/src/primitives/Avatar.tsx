import * as React from 'react';

export type AvatarTone = 'primary' | 'accent' | 'danger' | 'neutral';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: AvatarTone;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg',
};

const toneClasses: Record<AvatarTone, string> = {
  primary: 'bg-primary/20 text-primary border border-primary/30',
  accent: 'bg-accent/20 text-accent border border-accent/30',
  danger: 'bg-danger/20 text-danger border border-danger/30',
  neutral: 'bg-panel-strong text-text-muted',
};

export const Avatar = ({
  src,
  name,
  size = 'md',
  tone,
  className = '',
  ...props
}: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgAndBorderClass = tone ? toneClasses[tone] : 'bg-panel-strong';
  const textClass = tone ? '' : 'text-text-muted';

  return (
    <div
      className={`
        relative shrink-0 flex items-center justify-center rounded-full overflow-hidden elevation-raised
        ${bgAndBorderClass} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className={`font-bold ${textClass}`}>{initials}</span>
      )}
    </div>
  );
};

