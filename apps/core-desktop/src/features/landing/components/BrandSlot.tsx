import * as React from 'react';
import { useThemeStore } from '../../../stores/useThemeStore';
import { MEDIA } from '../../../lib/media';

interface BrandSlotProps {
  className?: string;
  animate?: boolean;
}

export const BrandSlot: React.FC<BrandSlotProps> = ({ className = '', animate = true }) => {
  const { theme } = useThemeStore();
  const [imgError, setImgError] = React.useState(false);

  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const logoSrc = resolvedTheme === 'dark' ? MEDIA.logo.onDark : MEDIA.logo.onLight;

  return (
    <div className={`flex items-center space-x-3 ${animate ? 'animate-item-rise delay-brand' : ''} ${className}`} style={{ animationFillMode: 'forwards' }}>
      <div className="h-[44px] flex items-center">
        {!imgError ? (
          <img
            src={logoSrc}
            alt="40Labs Logo"
            className="h-[36px] w-auto object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center space-x-1 font-sora font-bold text-lg">
            <span style={{ color: '#F97316' }}>40</span>
            <span style={{ color: '#16A34A' }}>Labs</span>
          </div>
        )}
      </div>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        CORE V1.0
      </span>
    </div>
  );
};
