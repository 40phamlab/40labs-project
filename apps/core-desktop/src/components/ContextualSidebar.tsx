import * as React from 'react';
import { PanelLeftClose, ChevronRight } from 'lucide-react';
import { Tooltip, Badge, type SubNavSection, type ContextualSubNavItem } from '@40labs/ui-components';
import { useSidebarState } from '../hooks/useSidebarState';

export interface ContextualSidebarProps {
  storageKey: string;
  sections: SubNavSection[];
  activeItemId: string;
  onSelect: (id: string) => void;
  className?: string;
  userPermissions?: string[];
}

export const ContextualSidebar: React.FC<ContextualSidebarProps> = ({
  storageKey,
  sections,
  activeItemId,
  onSelect,
  className = '',
  userPermissions = [],
}) => {
  const { state, cycleState, isOpen, isMini, isClosed } = useSidebarState(storageKey);
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  // Global Ctrl+B shortcut to cycle sidebar state
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        cycleState();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleState]);

  const handleItemKeyDown = (e: React.KeyboardEvent, items: ContextualSubNavItem[], currentIndex: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      const nextItem = items[nextIndex];
      itemRefs.current.get(nextItem.id)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      const prevItem = items[prevIndex];
      itemRefs.current.get(prevItem.id)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(items[currentIndex].id);
    }
  };

  return (
    <div className={`relative flex h-full shrink-0 select-none ${className}`}>
      {/* Sidebar Container with smooth transition */}
      <aside
        aria-label="Contextual Navigation"
        aria-hidden={isClosed}
        inert={isClosed}
        className={`flex flex-col h-full bg-surface-base border-r border-border/40 overflow-hidden transition-all duration-200 ease-in-out motion-reduce:transition-none ${
          isOpen ? 'w-56' : isMini ? 'w-16' : 'w-0 border-r-0'
        }`}
      >
        {/* Header / Collapse Cycle Control */}
        <div className={`flex items-center p-3 border-b border-border/30 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Navigation</span>}
          <button
            type="button"
            onClick={cycleState}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer"
            title={`Sidebar state: ${state}. Click or press Ctrl+B to cycle (Open -> Mini -> Closed)`}
            aria-label="Toggle sidebar state"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav role="navigation" className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
          {sections.map((section) => {
            const filteredItems = section.items.filter(
              (item) => !item.permissionRequired || userPermissions.includes(item.permissionRequired)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                {isOpen && section.title && (
                  <div className="px-3 py-1.5">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-heading">
                      {section.title}
                    </h3>
                  </div>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item, idx) => {
                    const isActive = activeItemId === item.id;
                    const buttonContent = (
                      <button
                        ref={(el) => {
                          if (el) itemRefs.current.set(item.id, el);
                          else itemRefs.current.delete(item.id);
                        }}
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        onKeyDown={(e) => handleItemKeyDown(e, filteredItems, idx)}
                        aria-current={isActive ? 'page' : undefined}
                        className={[
                          'w-full flex items-center gap-3 px-3 py-2 rounded-input text-xs transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring cursor-pointer',
                          isActive
                            ? 'bg-surface-elevated text-text-primary font-semibold shadow-sm'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface-hover font-medium',
                          isMini ? 'justify-center px-2' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {item.icon && (
                          <span className={`shrink-0 ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                            {item.icon}
                          </span>
                        )}

                        {isOpen && <span className="flex-1 text-left truncate">{item.label}</span>}

                        {isOpen && (
                          <>
                            {item.renderRight ? (
                              item.renderRight(isActive)
                            ) : (
                              item.badgeCount !== undefined && item.badgeCount > 0 && (
                                <Badge variant={isActive ? 'primary' : 'neutral'} size="sm" className="ml-2">
                                  {item.badgeCount}
                                </Badge>
                              )
                            )}
                          </>
                        )}
                      </button>
                    );

                    if (isMini) {
                      return (
                        <Tooltip key={item.id} content={item.label}>
                          {buttonContent}
                        </Tooltip>
                      );
                    }

                    return buttonContent;
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Closed Edge Handle (to reopen / cycle when closed) */}
      {isClosed && (
        <div className="absolute left-0 top-2 z-10">
          <button
            type="button"
            onClick={cycleState}
            className="w-5 h-8 flex items-center justify-center bg-surface-elevated border border-border/60 rounded-r-md text-text-muted hover:text-text-primary hover:bg-surface-hover shadow-sm transition-colors cursor-pointer"
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
