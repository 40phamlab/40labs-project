import * as React from 'react';
import { darkTokens, tokens } from '@40labs/design-tokens';

export interface BackgroundGridProps {
  className?: string;
}

export function BackgroundGrid({ className = '' }: BackgroundGridProps) {
  // Use tokens for grid pattern
  const lineColor = darkTokens.colors.gridLines; // rgba(255,255,255,0.03)
  const gridSize = tokens.spacing.grid; // 40px

  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, ${lineColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
      aria-hidden="true"
    />
  );
}
