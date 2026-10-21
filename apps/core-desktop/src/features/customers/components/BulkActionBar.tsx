import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { Download, MessageSquare, Archive, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onExport: () => void;
  onArchive: () => void;
  onClear: () => void;
  isArchiving?: boolean;
  isExporting?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onExport,
  onArchive,
  onClear,
  isArchiving = false,
  isExporting = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-20 bg-surface-elevated border-b border-border shadow-md px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-3">
        <span className="font-bold font-sora text-text-primary px-2 py-1 bg-action-primary/10 rounded text-action-primary">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          intent="secondary"
          size="sm"
          leftIcon={<Download size={14} className={isExporting ? 'animate-bounce' : ''} />}
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>

        <div className="relative group">
          <Button
            type="button"
            intent="neutral"
            size="sm"
            leftIcon={<MessageSquare size={14} />}
            disabled
          >
            Message
          </Button>
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-surface-primary text-[10px] text-text-muted rounded border border-border whitespace-nowrap shadow">
            Coming soon
          </div>
        </div>

        <Button
          type="button"
          intent="danger"
          size="sm"
          leftIcon={<Archive size={14} className={isArchiving ? 'animate-spin' : ''} />}
          onClick={onArchive}
          disabled={isArchiving}
        >
          {isArchiving ? 'Archiving...' : 'Archive'}
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={onClear}
          className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-secondary transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
