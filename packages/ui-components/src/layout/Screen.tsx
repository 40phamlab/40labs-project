import * as React from 'react';
import { LoadingState, ErrorState } from '../data-display/States';
import { EmptyState } from '../feedback/EmptyState';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';
import { ContextualSubNav, type SubNavSection } from '../navigation/ContextualSubNav';
import { useLayoutStore, type SubNavKey } from '../stores/useLayoutStore';
import { t } from '@40labs/i18n';

export interface ScreenSubNavConfig {
  storageKey: SubNavKey;
  sections: SubNavSection[];
  activeItemId: string;
  onSelect: (id: string) => void;
  widthClass?: string;
}

export interface ScreenProps {
  toolbar?: React.ReactNode;
  subNav?: ScreenSubNavConfig;
  scroll?: boolean;
  className?: string;
  bodyClassName?: string;
  overlays?: React.ReactNode;
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function Screen({
  toolbar,
  subNav,
  scroll = false,
  className = '',
  bodyClassName = '',
  overlays,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyIcon,
  emptyAction,
  children,
}: ScreenProps) {
  const subNavOpen = subNav ? useLayoutStore((s) => s.subNavOpen[subNav.storageKey]) : false;
  const setSubNavOpen = useLayoutStore((s) => s.setSubNavOpen);

  return (
    <main
      className={`flex-1 w-full h-full min-h-0 min-w-0 bg-app-bg text-text-primary flex flex-col p-3 gap-3 overflow-hidden relative ${className}`}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <ErrorState
            title="Failed to Load Content"
            onRetry={onRetry}
          />
        </div>
      ) : isEmpty ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <EmptyState
            title={emptyTitle}
            icon={emptyIcon}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          {toolbar}
          {subNav ? (
            <div className="flex w-full h-full min-h-0 min-w-0 overflow-hidden">
              <aside
                aria-hidden={!subNavOpen}
                inert={!subNavOpen}
                className={`shrink-0 h-full overflow-hidden transition-all duration-200 ${
                  subNavOpen ? `${subNav.widthClass || 'w-52'} mr-3.5 opacity-100` : 'w-0 mr-0 opacity-0'
                }`}
              >
                <div className={`${subNav.widthClass || 'w-52'} h-full overflow-y-auto custom-scrollbar border-r border-border/40 pr-3`}>
                  <div className="flex justify-end mb-2">
                    <IconButton
                      icon={<PanelLeftClose size={16} />}
                      label={t('nav.collapseSidebar')}
                      variant="ghost"
                      size="xs"
                      onClick={() => setSubNavOpen(subNav.storageKey, false)}
                    />
                  </div>
                  <ContextualSubNav
                    sections={subNav.sections}
                    activeItemId={subNav.activeItemId}
                    onSelect={subNav.onSelect}
                  />
                </div>
              </aside>

              {!subNavOpen && (
                <div className="shrink-0 mr-2 pt-0.5">
                  <IconButton
                    icon={<PanelLeftOpen size={16} />}
                    label={t('nav.expandSidebar')}
                    variant="neutral"
                    size="sm"
                    className="shadow-surface-pop border border-border/50"
                    onClick={() => setSubNavOpen(subNav.storageKey, true)}
                  />
                </div>
              )}

              <div
                className={`flex-1 min-w-0 min-h-0 h-full ${
                  scroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
                } flex flex-col ${bodyClassName}`}
              >
                {children}
              </div>
            </div>
          ) : (
            <div
              className={`flex-1 min-w-0 min-h-0 h-full ${
                scroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
              } flex flex-col ${bodyClassName}`}
            >
              {children}
            </div>
          )}
        </>
      )}
      {overlays}
    </main>
  );
}
