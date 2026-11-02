import * as React from 'react';
import { Folder } from 'lucide-react';
import { FileTypeIcon } from '@40labs/ui-components';
import { type ExplorerItemMetadata } from '../../../api/explorerApi';

export interface ExplorerGridViewProps {
  displayedItems: ExplorerItemMetadata[];
  selectedPaths: Set<string>;
  onSelectItem: (item: ExplorerItemMetadata, e: React.MouseEvent) => void;
  onOpenFile: (item: ExplorerItemMetadata) => void;
  onContextMenu: (e: React.MouseEvent, item?: ExplorerItemMetadata) => void;
  formatBytes: (bytes: number) => string;
  className?: string;
}

export const ExplorerGridView: React.FC<ExplorerGridViewProps> = ({
  displayedItems,
  selectedPaths,
  onSelectItem,
  onOpenFile,
  onContextMenu,
  formatBytes,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 p-2 ${className}`}
      onContextMenu={(e) => onContextMenu(e)}
    >
      {displayedItems.map((item) => {
        const isSelected = selectedPaths.has(item.path);
        return (
          <div
            key={item.path}
            onClick={(e) => onSelectItem(item, e)}
            onDoubleClick={() => onOpenFile(item)}
            onContextMenu={(e) => onContextMenu(e, item)}
            className={`p-3.5 rounded-[var(--radius-card)] border flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer transition-all elevation-raised ${
              isSelected
                ? 'border-[var(--color-action-primary)] bg-[var(--color-surface-selected)] shadow-md ring-2 ring-[var(--color-action-primary)]/40'
                : 'border-[var(--color-border-default)] bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]'
            }`}
            title={item.name}
          >
            <div className="p-3 rounded-xl bg-[var(--color-app-bg)] elevation-inset">
              {item.is_dir ? (
                <Folder size={36} className="text-[var(--color-warning)]" />
              ) : (
                <FileTypeIcon fileName={item.name} size={36} />
              )}
            </div>
            <span className="text-xs font-medium truncate w-full px-1 text-[var(--color-text-primary)]">
              {item.name}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
              {item.is_dir ? 'Folder' : formatBytes(item.size_bytes)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
