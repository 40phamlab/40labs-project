import * as React from 'react';
import type { Thread } from '@40labs/types';
import { ThreadListItem } from './ThreadListItem';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface ThreadListProps {
  threads: Thread[];
  selectedId: string | null;
  onSelectThread: (id: string) => void;
  onArchiveThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onNewConversation: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedId,
  onSelectThread,
  onArchiveThread,
  onDeleteThread,
  onNewConversation,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      if (t.archived) return false;

      if (categoryFilter === 'unread' && t.unread_count === 0) return false;
      if (categoryFilter !== 'all' && categoryFilter !== 'unread' && t.counterparty_type !== categoryFilter) return false;

      if (searchQuery && !t.display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [threads, searchQuery, categoryFilter]);

  const unreadThreadsCount = React.useMemo(() => {
    return threads.filter((t) => !t.archived && t.unread_count > 0).length;
  }, [threads]);

  return (
    <div className="flex flex-col w-80 h-full bg-panel border-r border-border/40 overflow-hidden shrink-0">
      {/* Header & KPI Summary */}
      <div className="p-3 border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-primary">Chats</h2>
            {unreadThreadsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {unreadThreadsCount} Unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Plus size={16} />}
              label="New Conversation"
              intent="primary"
              size="sm"
              onClick={onNewConversation}
            />
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh"
              intent="ghost"
              size="sm"
              onClick={onRefresh}
            />
          </div>
        </div>

        {/* Search and Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-input pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-input px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="gov">Gov</option>
            <option value="customers">Customers</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No conversations found.
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              isSelected={selectedId === thread.id}
              onClick={() => onSelectThread(thread.id)}
              onArchive={() => onArchiveThread(thread.id)}
              onDelete={() => onDeleteThread(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
