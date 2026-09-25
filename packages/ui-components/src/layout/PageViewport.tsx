import * as React from 'react';

export interface PageViewportProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageViewport
 *
 * Enclosed viewport for active screen contents. Provides consistent dark background,
 * isolated overflow handling, and full screen fit without clipping or layout jumping.
 */
export function PageViewport({ children, className = '' }: PageViewportProps) {
  return (
    <main
      className={`flex-1 w-full h-full min-h-0 min-w-0 bg-app-bg text-text-primary overflow-auto relative ${className}`}
    >
      {children}
    </main>
  );
}
