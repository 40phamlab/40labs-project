import * as React from 'react';
import type { Thread } from '@40labs/types';
import { Archive, Trash2 } from 'lucide-react';

export interface ThreadListItemProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isSelected,
  onClick,
  onArchive,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`relative group flex items-start gap-3 p-3 rounded-card cursor-pointer transition-colors border ${
        isSelected
          ? 'bg-panel-strong border-primary/40 shadow-xs'
          : 'bg-panel border-border/40 hover:bg-surface-hover hover:border-border'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 select-none">
        {getInitials(thread.display_name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-text truncate">{thread.display_name}</span>
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {new Date(thread.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[11px] text-text-muted truncate pr-4">
          {thread.last_message_preview || 'No messages yet...'}
        </p>
      </div>

      {/* Unread Badge */}
      {thread.unread_count > 0 && (
        <span className="absolute top-3 right-3 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
          {thread.unread_count}
        </span>
      )}

      {/* Context Menu / Dropdown */}
      {menuOpen && (
        <div className="absolute right-2 top-10 z-50 bg-panel border border-border shadow-lg rounded-md py-1 w-36">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onArchive();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-surface-hover text-left"
          >
            <Archive size={13} /> Archive Thread
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-surface-hover text-left"
          >
            <Trash2 size={13} /> Delete / Archive
          </button>
        </div>
      )}
    </div>
  );
};
