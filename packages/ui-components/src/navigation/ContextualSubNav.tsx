import React from 'react';
import { Badge } from '../primitives/Badge';

export interface ContextualSubNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  renderRight?: (isActive: boolean) => React.ReactNode;
  permissionRequired?: string;
}

export interface SubNavSection {
  id: string;
  title?: string;
  items: ContextualSubNavItem[];
}

export interface ContextualSubNavProps {
  sections: SubNavSection[];
  activeItemId: string;
  onSelect: (id: string) => void;
  userPermissions?: string[];
  className?: string;
  itemClassName?: string;
}

export function ContextualSubNav({
  sections,
  activeItemId,
  onSelect,
  userPermissions = [],
  className = '',
  itemClassName = '',
}: ContextualSubNavProps) {
  return (
    <nav className={`flex flex-col w-full ${className}`}>
      {sections.map((section) => {
        const filteredItems = section.items.filter(item =>
          !item.permissionRequired || userPermissions.includes(item.permissionRequired)
        );

        if (filteredItems.length === 0) return null;

        return (
          <div key={section.id} className="mb-6 last:mb-0">
            {section.title && (
              <div className="px-4 py-3 mb-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent font-heading">
                  {section.title}
                </h3>
              </div>
            )}
            <div className="space-y-0.5">
              {filteredItems.map((item) => {
                const isActive = activeItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-input text-xs font-medium transition-all duration-200
                      ${
                        isActive
                          ? 'bg-panel-strong text-primary elevation-raised shadow-inner-soft border-l-4 border-primary'
                          : 'text-text-muted hover:text-text hover:bg-panel/40'
                      }
                      ${itemClassName}
                    `}
                  >
                    {item.icon && (
                      <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text'}`}>
                        {item.icon}
                      </span>
                    )}

                    <span className="flex-1 text-left truncate">{item.label}</span>

                    {item.renderRight ? (
                      item.renderRight(isActive)
                    ) : (
                      item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <Badge
                          variant={isActive ? 'primary' : 'neutral'}
                          size="sm"
                          className="ml-2"
                        >
                          {item.badgeCount}
                        </Badge>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
