import * as React from 'react';
import { PageViewport, PageContent } from '@40labs/ui-components';

interface TabContainerProps {
  /** Pass a <PageToolbar …/>. Renders pinned at the top, inside the container. */
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
  /** Body scrolls (Reports, long forms). Default false: screens manage their own panes. */
  scroll?: boolean;
  bodyClassName?: string;
  /** Modals/drawers. Rendered as siblings of the container, outside its overflow clipping. */
  overlays?: React.ReactNode;
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  toolbar,
  children,
  scroll = false,
  bodyClassName = '',
  overlays,
  ...stateProps
}) => (
  <PageViewport>
    <PageContent scrollable={false} variant="panel" padding="normal" {...stateProps}>
      {toolbar}
      <div
        className={`flex-1 min-h-0 min-w-0 flex flex-col ${
          scroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
        } ${bodyClassName}`}
      >
        {children}
      </div>
    </PageContent>
    {overlays}
  </PageViewport>
);
