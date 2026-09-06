import * as React from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg',
};

export const Avatar = ({
  src,
  name,
  size = 'md',
  className = '',
}: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        relative shrink-0 flex items-center justify-center rounded-full bg-panel-strong overflow-hidden elevation-raised
        ${sizeClasses[size]} ${className}
      `}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-text-muted">{initials}</span>
      )}
    </div>
  );
};
