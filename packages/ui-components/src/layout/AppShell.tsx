import * as React from 'react';

export interface AppShellProps {
  /** Top navigation/chrome bar */
  topBar?: React.ReactNode;
  /** Primary sidebar navigation */
  sidebar?: React.ReactNode;
  /** Main application content viewport or PageViewport component */
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell
 *
 * Core application shell container establishing a single consistent layout model.
 * Solid dark background, solid top chrome, solid sidebar, and isolated main viewport.
 */
export function AppShell({
  topBar,
  sidebar,
  children,
  className = '',
}: AppShellProps) {
  return (
    <div
      className={`flex flex-col h-screen w-screen bg-app-bg text-text-primary font-ui overflow-hidden select-none ${className}`}
    >
      {/* Top Chrome Header */}
      {topBar && (
        <header className="shrink-0 w-full z-30 bg-top-chrome border-b border-border">
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
