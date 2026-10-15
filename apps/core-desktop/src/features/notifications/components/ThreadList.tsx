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
  className?: string;
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
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<string>('all');

  const counts = React.useMemo(() => {
    let all = 0;
    let unread = 0;
    let customers = 0;
    let business = 0;
    let gov = 0;
    let system = 0;
    let archived = 0;

    for (const t of threads) {
      if (t.archived) {
        archived++;
        continue;
      }
      all++;
      if (t.unread_count > 0) unread++;
      if (t.counterparty_type === 'customer') customers++;
      if (t.counterparty_type === 'business') business++;
      if (t.counterparty_type === 'gov') gov++;
      if (t.counterparty_type === 'marketing' || t.counterparty_type === 'system') system++;
    }

    return { all, unread, customers, business, gov, system, archived };
  }, [threads]);

  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      if (filter === 'archived') {
        if (!t.archived) return false;
      } else {
        if (t.archived) return false;
        if (filter === 'unread' && t.unread_count === 0) return false;
        if (filter === 'customers' && t.counterparty_type !== 'customer') return false;
        if (filter === 'business' && t.counterparty_type !== 'business') return false;
        if (filter === 'gov' && t.counterparty_type !== 'gov') return false;
        if (filter === 'system' && t.counterparty_type !== 'marketing' && t.counterparty_type !== 'system') return false;
      }

      if (searchQuery && !t.display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [threads, searchQuery, filter]);

  const chips = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'unread', label: 'Unread', count: counts.unread },
    { key: 'customers', label: 'Customers', count: counts.customers },
    { key: 'business', label: 'Business', count: counts.business },
    { key: 'gov', label: 'Gov', count: counts.gov },
    { key: 'system', label: 'System', count: counts.system },
    { key: 'archived', label: 'Archived', count: counts.archived },
  ];

  return (
    <div className={`flex flex-col h-full bg-panel rounded-card elevation-raised border border-border/50 overflow-hidden ${className || 'w-80 shrink-0'}`}>
      {/* Header */}
      <div className="p-3 bg-panel-strong border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Chats</h2>
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

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-input pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                filter === chip.key
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-panel-strong text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
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
