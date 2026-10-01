'use client';

import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';

export type NavigationState = 'closed' | 'icon' | 'open';

export interface AppShellContextValue {
  navState: NavigationState;
  lastVisibleNavState: 'icon' | 'open';
  setNavState: (state: NavigationState) => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  hideSidebar: () => void;
  reopenSidebar: () => void;
  toggleSidebar: () => void;
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    return {
      navState: 'open',
      lastVisibleNavState: 'open',
      setNavState: () => {},
      collapseSidebar: () => {},
      expandSidebar: () => {},
      hideSidebar: () => {},
      reopenSidebar: () => {},
      toggleSidebar: () => {},
    };
  }
  return context;
}

export interface AppShellProps {
  /** Top navigation/chrome bar */
  topBar?: React.ReactNode;
  /** Primary sidebar navigation */
  sidebar?: React.ReactNode;
  /** Main application content viewport or PageViewport component */
  children: React.ReactNode;
  className?: string;
  /** Minimum desktop width (default 0 for natural shrinking) */
  minWidth?: number | string;
  /** Minimum desktop height (default 0 for natural shrinking) */
  minHeight?: number | string;
  /** Navigation sidebar state */
  navState?: NavigationState | string;
  /** Initial navigation sidebar state when uncontrolled (default 'open') */
  defaultNavState?: NavigationState | string;
  /** Callback fired when navigation sidebar state changes */
  onNavStateChange?: (state: NavigationState) => void;
  /** Enable Ctrl+B / Cmd+B keyboard shortcut to toggle sidebar (default true) */
  enableHotkey?: boolean;
  /** Show persistent floating reopen button when sidebar is hidden (default false) */
  showReopenControl?: boolean;
}

const normalizeState = (state: string | undefined, defaultState: NavigationState = 'open'): NavigationState => {
  if (state === 'closed' || state === 'icon' || state === 'open') return state;
  if (state === 'expanded') return 'open';
  if (state === 'compact') return 'icon';
  if (state === 'hidden') return 'closed';
  return defaultState;
};

/**
 * AppShell
 *
 * Core application shell container establishing a single consistent layout model.
 * Solid dark background, solid top chrome, solid sidebar, and isolated main viewport.
 * Supports 3 distinct navigation states: 'closed', 'icon', 'open'.
 */
export function AppShell({
  topBar,
  sidebar,
  children,
  className = '',
  minWidth = 0,
  minHeight = 0,
  navState: controlledNavState,
  defaultNavState = 'open',
  onNavStateChange,
  enableHotkey = true,
  showReopenControl = false,
}: AppShellProps) {
  const initialNavState = normalizeState(controlledNavState ?? defaultNavState, 'open');
  const [internalNavState, setInternalNavState] = useState<NavigationState>(initialNavState);
  const [lastNonClosedState, setLastNonClosedState] = useState<'icon' | 'open'>(
    initialNavState !== 'closed' ? initialNavState : 'open'
  );

  const navState = normalizeState(controlledNavState ?? internalNavState, 'open');

  const handleNavStateChange = useCallback(
    (newState: NavigationState) => {
      const normalized = normalizeState(newState);
      if (normalized !== 'closed') {
        setLastNonClosedState(normalized);
      }
      if (controlledNavState === undefined) {
        setInternalNavState(normalized);
      }
      onNavStateChange?.(normalized);
    },
    [controlledNavState, onNavStateChange]
  );

  const toggleSidebar = useCallback(() => {
    if (navState === 'closed') {
      handleNavStateChange(lastNonClosedState);
    } else {
      handleNavStateChange('closed');
    }
  }, [navState, lastNonClosedState, handleNavStateChange]);

  // Keyboard shortcut listener (Ctrl+B / Cmd+B)
  useEffect(() => {
    if (!enableHotkey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkey, toggleSidebar]);

  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      navState,
      lastVisibleNavState: lastNonClosedState,
      setNavState: handleNavStateChange,
      collapseSidebar: () => handleNavStateChange('icon'),
      expandSidebar: () => handleNavStateChange('open'),
      hideSidebar: () => handleNavStateChange('closed'),
      reopenSidebar: () => handleNavStateChange(lastNonClosedState),
      toggleSidebar,
    }),
    [navState, lastNonClosedState, handleNavStateChange, toggleSidebar]
  );

  const minWidthStyle = minWidth !== undefined && minWidth !== 0 ? (typeof minWidth === 'number' ? `${minWidth}px` : minWidth) : undefined;
  const minHeightStyle = minHeight !== undefined && minHeight !== 0 ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined;

  return (
    <AppShellContext.Provider value={contextValue}>
      <div
        className={`flex flex-col h-screen w-screen bg-app-bg text-text-primary font-ui overflow-hidden select-none ${className}`}
        style={{
          ...(minWidthStyle ? { minWidth: minWidthStyle } : {}),
          ...(minHeightStyle ? { minHeight: minHeightStyle } : {}),
        }}
        data-nav-state={navState}
      >
        {/* Top Chrome Header */}
        {topBar && (
          <header className="shrink-0 w-full z-30 bg-top-chrome border-b border-border min-h-[40px]">
            {topBar}
          </header>
        )}

        {/* Main Container: Sidebar + Viewport */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
          {/* Persistent Reopen Control when Hidden */}
          {navState === 'closed' && showReopenControl && (
            <div className="absolute top-2 left-2 z-40">
              <IconButton
                icon={<PanelLeftOpen size={16} />}
                onClick={() => handleNavStateChange(lastNonClosedState)}
                intent="secondary"
                size="sm"
                label="Reopen navigation sidebar"
                title="Reopen navigation sidebar (Ctrl+B)"
                className="elevation-raised bg-surface-elevated hover:bg-surface-hover border border-border-strong text-action-primary shadow-md transition-all duration-150"
              />
            </div>
          )}

          {sidebar && (
            <aside
              className={`shrink-0 h-full z-20 bg-sidebar border-r border-border transition-[width,opacity] duration-200 ease-in-out flex flex-col absolute md:relative ${
                navState === 'closed'
                  ? 'w-0 opacity-0 border-r-0 overflow-hidden pointer-events-none'
                  : navState === 'icon'
                  ? 'w-16 opacity-100 z-30 md:z-20'
                  : 'w-60 opacity-100 z-40 md:z-20 shadow-2xl md:shadow-none'
              }`}
              aria-hidden={navState === 'closed'}
              data-testid="app-shell-sidebar-container"
            >
              {sidebar}
            </aside>
          )}

          <main className="flex-1 min-w-0 h-full overflow-hidden relative" data-testid="app-shell-main-workspace">
            {children}
          </main>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
