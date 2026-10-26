// COPIED FROM: apps/core-desktop/src/components/TabContainer.tsx
import * as React from 'react';

export interface TabContainerProps {
  isEmpty?: boolean;
  emptyTitle?: string;
  children?: React.ReactNode;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  isEmpty,
  emptyTitle = 'Module',
  children,
}) => {
  return (
    <div className="h-full w-full flex flex-col bg-surface p-6 overflow-auto">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <h2 className="text-lg font-heading font-semibold text-text-primary mb-2">{emptyTitle}</h2>
          <p className="text-sm">Module view under construction (Admin Phase 0 shell smoke test).</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
