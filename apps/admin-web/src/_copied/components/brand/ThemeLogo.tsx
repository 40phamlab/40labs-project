// COPIED FROM: apps/core-desktop/src/components/brand/ThemeLogo.tsx
import * as React from 'react';

export interface ThemeLogoProps {
  variant: 'full' | 'mark';
  height?: number;
  className?: string;
}

export function ThemeLogo({ height, className }: ThemeLogoProps) {
  return (
    <div className={`flex items-center justify-center font-bold text-action-primary ${className || ''}`} style={height ? { height: `${height}px` } : undefined}>
      40
    </div>
  );
}
