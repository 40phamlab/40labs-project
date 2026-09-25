import * as React from 'react';

export interface AppShellProps {
  /** Top navigation/chrome bar */
  topBar?: React.ReactNode;
  /** Primary sidebar navigation */
  sidebar?: React.ReactNode;
  /** Main application content viewport or PageViewport component */
  children: React.ReactNode;
  className?: string;
  /** Minimum desktop width (default 1024px) */
  minWidth?: number | string;
}

/**
 * AppShell
 *
 * Core application shell container establishing a single consistent layout model.
 * Solid dark background, solid top chrome, solid sidebar, and isolated main viewport.
 * Standardizes minimum desktop width behavior and global layout structure.
 */
export function AppShell({
  topBar,
  sidebar,
  children,
  className = '',
  minWidth = 1024,
}: AppShellProps) {
  const minWidthStyle = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;

  return (
    <div
      className={`flex flex-col h-screen w-screen bg-app-bg text-text-primary font-ui overflow-hidden select-none ${className}`}
      style={{ minWidth: minWidthStyle }}
    >
      {/* Top Chrome Header */}
      {topBar && (
        <header className="shrink-0 w-full z-30 bg-top-chrome border-b border-border min-h-[40px]">
          {topBar}
        </header>
      )}

      {/* Main Container: Sidebar + Viewport */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {sidebar && (
          <aside className="shrink-0 h-full z-20 bg-sidebar border-r border-border flex flex-col">
            {sidebar}
          </aside>
        )}
        <div className="flex-1 min-w-0 h-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
