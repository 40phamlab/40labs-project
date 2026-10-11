import * as React from 'react';
import { MEDIA } from '../../lib/media';
import { useThemeStore } from '../../stores/useThemeStore';

export interface ThemeLogoProps {
  variant: 'full' | 'mark';
  height?: number;
  className?: string;
}

export function ThemeLogo({ variant, height, className }: ThemeLogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const [domTheme, setDomTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'light' ? 'light' : 'dark';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateDomTheme = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') {
        setDomTheme(attr);
      }
    };
    updateDomTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          updateDomTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const activeTheme = theme || domTheme;

  const src =
    variant === 'mark'
      ? MEDIA.logo.mark
      : activeTheme === 'light'
      ? MEDIA.logo.onLight
      : MEDIA.logo.onDark;

  return (
    <img
      src={src}
      alt="40Labs"
      draggable={false}
      height={height}
      className={className}
      style={height ? { height: `${height}px`, width: 'auto' } : undefined}
    />
  );
}
