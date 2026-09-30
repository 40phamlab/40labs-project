'use client';

import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';

export type NavigationState = 'expanded' | 'compact' | 'hidden';

export interface AppShellContextValue {
  navState: NavigationState;
  lastVisibleNavState: 'expanded' | 'compact';
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
      navState: 'expanded',
      lastVisibleNavState: 'expanded',
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
  navState?: NavigationState;
  /** Initial navigation sidebar state when uncontrolled (default 'expanded') */
  defaultNavState?: NavigationState;
  /** Callback fired when navigation sidebar state changes */
  onNavStateChange?: (state: NavigationState) => void;
  /** Enable Ctrl+B / Cmd+B keyboard shortcut to toggle sidebar (default true) */
  enableHotkey?: boolean;
  /** Show persistent floating reopen button when sidebar is hidden (default true) */
  showReopenControl?: boolean;
}

/**
 * AppShell
 *
 * Core application shell container establishing a single consistent layout model.
 * Solid dark background, solid top chrome, solid sidebar, and isolated main viewport.
 * Standardizes minimum desktop width behavior and global 3-state navigation layout structure.
 */
export function AppShell({
  topBar,
  sidebar,
  children,
  className = '',
  minWidth = 0,
  minHeight = 0,
  navState: controlledNavState,
  defaultNavState = 'expanded',
  onNavStateChange,
  enableHotkey = true,
  showReopenControl = true,
}: AppShellProps) {
  const initialNavState = controlledNavState ?? defaultNavState;
  const [internalNavState, setInternalNavState] = useState<NavigationState>(defaultNavState);
  const [lastVisibleNavState, setLastVisibleNavState] = useState<'expanded' | 'compact'>(
    initialNavState === 'hidden' ? 'expanded' : initialNavState
  );

  const navState = controlledNavState ?? internalNavState;

  const handleNavStateChange = useCallback(
    (newState: NavigationState) => {
      if (newState !== 'hidden') {
        setLastVisibleNavState(newState);
      }
      if (controlledNavState === undefined) {
        setInternalNavState(newState);
      }
      onNavStateChange?.(newState);
    },
    [controlledNavState, onNavStateChange]
  );

  const collapseSidebar = useCallback(() => handleNavStateChange('compact'), [handleNavStateChange]);
  const expandSidebar = useCallback(() => handleNavStateChange('expanded'), [handleNavStateChange]);
  const hideSidebar = useCallback(() => handleNavStateChange('hidden'), [handleNavStateChange]);
  const reopenSidebar = useCallback(
    () => handleNavStateChange(lastVisibleNavState),
    [handleNavStateChange, lastVisibleNavState]
  );
  const toggleSidebar = useCallback(() => {
    if (navState === 'hidden') {
      reopenSidebar();
    } else if (navState === 'expanded') {
      collapseSidebar();
    } else {
      hideSidebar();
    }
  }, [navState, reopenSidebar, collapseSidebar, hideSidebar]);

  // Keyboard shortcut listener (Ctrl+B / Cmd+B)
  useEffect(() => {
    if (!enableHotkey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (navState === 'hidden') {
          reopenSidebar();
        } else {
          hideSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkey, navState, hideSidebar, reopenSidebar]);

  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      navState,
      lastVisibleNavState,
      setNavState: handleNavStateChange,
      collapseSidebar,
      expandSidebar,
      hideSidebar,
      reopenSidebar,
      toggleSidebar,
    }),
    [
      navState,
      lastVisibleNavState,
      handleNavStateChange,
      collapseSidebar,
      expandSidebar,
      hideSidebar,
      reopenSidebar,
      toggleSidebar,
    ]
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
          {navState === 'hidden' && showReopenControl && (
            <div className="absolute top-2 left-2 z-40">
              <IconButton
                icon={<PanelLeftOpen size={16} />}
                onClick={reopenSidebar}
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
              className={`shrink-0 h-full z-20 bg-sidebar border-r border-border transition-[width,opacity] duration-200 ease-in-out flex flex-col ${
                navState === 'hidden'
                  ? 'w-0 opacity-0 border-r-0 overflow-hidden pointer-events-none'
                  : navState === 'compact'
                  ? 'w-16 opacity-100'
                  : 'w-60 opacity-100'
              }`}
              aria-hidden={navState === 'hidden'}
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
