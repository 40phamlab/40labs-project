import React from 'react';
import { SearchInput } from '../forms/SearchInput';
import { HotkeyBadge } from '../primitives/Hotkey';
import { Button } from '../primitives/Button';

export interface StatusIndicator {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'accent' | 'danger' | 'text-muted';
  type?: 'pill' | 'dot';
}

export interface HeaderAction {
  id: string;
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  hasBadge?: boolean;
  badgeColor?: 'primary' | 'accent' | 'danger';
}

export interface DashboardHeaderBarProps {
  moduleTitle: string;
  statusIndicatorColor?: 'green' | 'orange' | 'red';
  searchPlaceholder?: string;
  searchHotkeys?: string[];
  statusIndicators?: StatusIndicator[];
  actionButtons?: HeaderAction[];
  onSearch?: (query: string) => void;
  className?: string;
}

const statusColorMap = {
  green: 'bg-primary',
  orange: 'bg-accent',
  red: 'bg-danger',
};

const indicatorColorMap = {
  primary: 'text-primary',
  accent: 'text-accent',
  danger: 'text-danger',
  'text-muted': 'text-text-muted',
};

const dotColorMap = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  danger: 'bg-danger',
  'text-muted': 'bg-text-muted',
};

export function DashboardHeaderBar({
  moduleTitle,
  statusIndicatorColor = 'green',
  searchPlaceholder = 'Search...',
  searchHotkeys = [],
  statusIndicators = [],
  actionButtons = [],
  onSearch,
  className = '',
}: DashboardHeaderBarProps) {
  const dotColorClass = statusColorMap[statusIndicatorColor];

  return (
    <header
      className={`
        flex items-center justify-between px-6 h-16 bg-surface border-b border-border/10
        sticky top-0 z-30 ${className}
      `}
    >
      {/* Left: Module Title & Status Dot */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass} shadow-[0_0_8px_rgba(0,0,0,0.3)] animate-pulse`} />
        <h2 className="text-sm font-heading font-bold text-text uppercase tracking-widest">
          {moduleTitle}
        </h2>
      </div>

      {/* Center: Search with Shortcut */}
      <div className="flex-1 max-w-xl mx-8 relative group">
        <SearchInput
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="!h-9"
        />
        {searchHotkeys.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex gap-1 items-center opacity-40 group-focus-within:opacity-100 transition-opacity">
            {searchHotkeys.map((key) => (
              <HotkeyBadge key={key} className="scale-75 origin-right">{key}</HotkeyBadge>
            ))}
          </div>
        )}
      </div>

      {/* Right: Status Indicators & Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {statusIndicators.map((indicator) => (
          <div
            key={indicator.id}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/10
              ${indicator.type === 'pill' ? 'bg-panel-strong/40' : ''}
            `}
          >
            {indicator.icon && <span className="text-text-muted">{indicator.icon}</span>}
            {indicator.type === 'dot' && (
               <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[indicator.color || 'primary']}`} />
            )}
            <span className="text-[10px] font-mono font-bold text-text-muted uppercase">
              {indicator.label}: {indicator.value}
            </span>
          </div>
        ))}

        {actionButtons.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="relative p-2 rounded-full hover:bg-panel-strong/50 transition-colors text-text-muted hover:text-text"
            aria-label={action.label}
          >
            {action.icon}
            {action.hasBadge && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 ${dotColorMap[action.badgeColor || 'primary']} rounded-full border border-surface shadow-sm`} />
            )}
          </button>
        ))}
      </div>
    </header>
  );
}
