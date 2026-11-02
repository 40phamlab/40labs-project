import * as React from 'react';
import { HardDrive } from 'lucide-react';

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

export interface ExplorerBreadcrumbProps {
  currentPath: string;
  breadcrumbSegments: BreadcrumbSegment[];
  onNavigate: (path: string) => void;
  className?: string;
}

export const ExplorerBreadcrumb: React.FC<ExplorerBreadcrumbProps> = ({
  breadcrumbSegments,
  onNavigate,
  className = '',
}) => {
  return (
    <div
      className={`flex-1 min-w-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-app-bg)] border border-[var(--color-border-default)] rounded-[var(--radius-input)] text-xs font-mono overflow-x-auto whitespace-nowrap custom-scrollbar elevation-inset ${className}`}
      aria-label="File path breadcrumbs"
    >
      <HardDrive size={14} className="text-[var(--color-action-primary)] shrink-0 mr-1" />
      {breadcrumbSegments.map((segment, idx) => (
        <React.Fragment key={segment.path}>
          {idx > 0 && <span className="text-[var(--color-text-muted)]/50 font-sans px-0.5 select-none">/</span>}
          <button
            type="button"
            onClick={() => onNavigate(segment.path)}
            className={`hover:text-[var(--color-action-primary)] hover:underline transition-colors cursor-pointer truncate max-w-[180px] ${
              idx === breadcrumbSegments.length - 1
                ? 'font-bold text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)]'
            }`}
            title={segment.path}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
