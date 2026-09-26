import * as React from 'react';

export interface PageViewportProps {
  children: React.ReactNode;
  className?: string;
  /** Padding around the viewport layout */
  padding?: 'normal' | 'compact' | 'loose' | 'none';
}

/**
 * PageViewport
 *
 * Enclosed viewport for active screen contents in the 40Labs canonical page layout.
 * Establishes consistent dark background, isolated overflow handling, standardized
 * padding, and vertical flex structure housing PageHeader, PageToolbar, and PageContent.
 */
export function PageViewport({
  children,
  className = '',
  padding = 'normal',
}: PageViewportProps) {
  const paddingClasses = {
    none: 'p-0 gap-0',
    compact: 'p-2.5 gap-2',
    normal: 'p-3.5 gap-3',
    loose: 'p-5 gap-4',
  };

  return (
    <main
      className={`flex-1 w-full h-full min-h-0 min-w-0 bg-app-bg text-text-primary flex flex-col overflow-hidden relative ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </main>
  );
}
