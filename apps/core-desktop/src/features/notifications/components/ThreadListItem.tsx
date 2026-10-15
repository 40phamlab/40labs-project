import * as React from 'react';
import type { Thread } from '@40labs/types';
import { Archive, Trash2, MailOpen, Flag, Share2, Mic, Paperclip } from 'lucide-react';
import { Tooltip } from '@40labs/ui-components';
import { NotificationAvatar, getInitials } from './NotificationAvatar';

export { getInitials };

export interface ThreadListItemProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  onMarkUnread?: () => void;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isSelected,
  onClick,
  onArchive,
  onUnarchive,
  onDelete,
  onMarkUnread,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  React.useEffect(() => {
    const handleClickOutside = () => setMenuOpen(false);
    if (menuOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const preview = thread.last_message_preview || 'No messages yet...';
  const hasAudio = preview.includes('voice') || preview.includes('audio');
  const hasAttachment = preview.includes('Attachment') || preview.includes('📎');

  return (
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`relative group flex items-start gap-3 p-3 rounded-card cursor-pointer transition-colors border ${
        isSelected
          ? 'bg-surface-selected border-border-selected shadow-xs'
          : 'bg-panel border-border/40 hover:bg-surface-hover hover:border-border'
      }`}
    >
      {/* Avatar */}
      <NotificationAvatar
        name={thread.display_name}
        counterpartyType={thread.counterparty_type}
        size="md"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-text truncate">{thread.display_name}</span>
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {new Date(thread.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[11px] text-text-muted truncate pr-4 flex items-center gap-1">
          {hasAudio && <Mic size={12} className="text-warning shrink-0" />}
          {hasAttachment && <Paperclip size={12} className="text-primary shrink-0" />}
          <span className="truncate">{preview}</span>
        </p>
      </div>

      {/* Unread Badge */}
      {thread.unread_count > 0 && (
        <span className="absolute top-3 right-3 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
          {thread.unread_count}
        </span>
      )}

      {/* Context Menu / Dropdown portal */}
      {menuOpen && (
        <div
          style={{ top: menuPos.y, left: menuPos.x }}
          className="fixed z-[9999] bg-panel border border-border shadow-xl rounded-card py-1 w-44 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onClick(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-surface-hover text-left font-medium"
          >
            Open
          </button>
          {onMarkUnread && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onMarkUnread(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-surface-hover text-left font-medium"
            >
              <MailOpen size={13} /> Mark as unread
            </button>
          )}
          {thread.archived && onUnarchive ? (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onUnarchive(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-surface-hover text-left font-medium"
            >
              <Archive size={13} /> Unarchive
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onArchive(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-surface-hover text-left font-medium"
            >
              <Archive size={13} /> Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-surface-hover text-left font-medium"
          >
            <Trash2 size={13} /> Delete
          </button>
          <div className="border-t border-border/40 my-1" />
          <Tooltip content="Coming soon...">
            <div className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted cursor-not-allowed">
              <Flag size={13} /> Report
            </div>
          </Tooltip>
          <Tooltip content="Coming soon...">
            <div className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted cursor-not-allowed">
              <Share2 size={13} /> Forward
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
