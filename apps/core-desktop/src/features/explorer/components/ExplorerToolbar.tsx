import * as React from 'react';
import {
  FolderPlus,
  Edit3,
  Trash2,
  ExternalLink,
  List as ListIcon,
  Grid as GridIcon,
} from 'lucide-react';
import { Button } from '@40labs/ui-components';
import { type ExplorerItemMetadata } from '../../../api/explorerApi';

export interface ExplorerToolbarProps {
  historyIndex: number;
  historyLength: number;
  hasParentPath: boolean;
  loading: boolean;
  selectedPaths: Set<string>;
  selectedItem: ExplorerItemMetadata | null;
  viewMode: 'list' | 'grid';
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onReveal: () => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  className?: string;
}

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  selectedPaths,
  selectedItem,
  viewMode,
  onNewFolder,
  onRename,
  onDelete,
  onReveal,
  onViewModeChange,
  className = '',
}) => {
  return (
    <div
      className={`h-11 px-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-primary)] flex items-center justify-between gap-3 shrink-0 ${className}`}
    >
      {/* Left Action Buttons with proper disabled & tactile styling */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onNewFolder();
          }}
          className="h-7 text-xs flex items-center gap-1.5 elevation-raised hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]"
        >
          <FolderPlus size={14} className="text-[var(--color-warning)]" />
          <span>New Folder</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={selectedPaths.size !== 1}
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="h-7 text-xs flex items-center gap-1.5 elevation-raised disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[var(--color-surface-hover)]"
        >
          <Edit3 size={14} />
          <span>Rename</span>
        </Button>

        <Button
          size="sm"
          variant="danger"
          disabled={selectedPaths.size === 0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-7 text-xs flex items-center gap-1.5 elevation-raised disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </Button>

        {selectedItem && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onReveal();
            }}
            className="h-7 text-xs flex items-center gap-1.5 elevation-raised hover:bg-[var(--color-surface-hover)]"
            title="Reveal in OS File Manager"
          >
            <ExternalLink size={14} />
            <span>Reveal</span>
          </Button>
        )}
      </div>

      {/* Right Selection Count & View Mode Switcher */}
      <div className="flex items-center gap-3">
        {selectedPaths.size > 0 && (
          <span className="text-xs text-[var(--color-action-primary)] font-semibold px-2 py-0.5 rounded bg-[var(--color-action-primary)]/10 border border-[var(--color-action-primary)]/30">
            {selectedPaths.size} item(s) selected
          </span>
        )}

        <div className="flex items-center bg-[var(--color-app-bg)] border border-[var(--color-border-default)] rounded-[var(--radius-input)] p-0.5 elevation-inset">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-action-primary)] font-bold shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
            title="List View"
            aria-label="List View"
          >
            <ListIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-action-primary)] font-bold shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <GridIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
