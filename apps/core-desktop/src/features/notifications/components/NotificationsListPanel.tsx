import * as React from 'react';
import {
  Dropdown,
  DropdownMenuItem,
  Button,
  Panel,
  Tooltip,
  SearchInput,
  IconButton,
  EmptyState,
} from '@40labs/ui-components';
import { MailOpen, Share2, Trash2, Archive, CheckCheck, RefreshCw, Plus, Filter } from 'lucide-react';
import type { Notification, MessageChannel } from '@40labs/types';
import { NotificationListItem } from './NotificationListItem';

export interface NotificationsListPanelProps {
  notifications: Notification[];
  selectedId?: string | null;
  categoryFilter?: string | null;
  channelFilter?: 'all' | MessageChannel;
  onSelectNotification: (id: string) => void;
  onCategoryChange?: (category: string | null) => void;
  onChannelChange?: (channel: 'all' | MessageChannel) => void;
  onArchiveNotification: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllRead?: () => void;
  onNewConversation?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const FILTER_CHIPS: Array<{ label: string; value: string | null }> = [
  { label: 'All', value: null },
  { label: 'Unread', value: 'unread' },
  { label: 'Gov', value: 'gov' },
  { label: 'Customers', value: 'customers' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Business', value: 'business' },
  { label: 'Archived', value: 'archived' },
];

const CHANNEL_OPTIONS: Array<{ label: string; value: 'all' | MessageChannel }> = [
  { label: 'All Channels', value: 'all' },
  { label: 'aMob', value: 'amob' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'SMS', value: 'sms' },
  { label: 'Email', value: 'email' },
];

export const NotificationsListPanel: React.FC<NotificationsListPanelProps> = ({
  notifications,
  selectedId,
  categoryFilter,
  channelFilter = 'all',
  onSelectNotification,
  onCategoryChange,
  onChannelChange,
  onArchiveNotification,
  onDeleteNotification,
  onMarkAllRead,
  onNewConversation,
  isLoading = false,
  onRefresh,
  className = '',
}) => {
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localChannelFilter, setLocalChannelFilter] = React.useState<'all' | MessageChannel>('all');
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = React.useState(false);

  const activeChannel = channelFilter !== undefined ? channelFilter : localChannelFilter;
  const setActiveChannel = onChannelChange || setLocalChannelFilter;

  // Unread count across notifications
  const unreadCount = React.useMemo(
    () => notifications.filter((n) => n.status === 'unread').length,
    [notifications]
  );

  // Base list depending on category filter
  const baseActiveList = React.useMemo(() => {
    let list = notifications;
    if (!categoryFilter) {
      list = list.filter((n) => n.status !== 'archived');
    } else if (categoryFilter === 'unread') {
      list = list.filter((n) => n.status === 'unread');
    } else if (categoryFilter === 'archived') {
      list = list.filter((n) => n.status === 'archived');
    } else {
      list = list.filter((n) => n.category === categoryFilter && n.status !== 'archived');
    }
    return list;
  }, [notifications, categoryFilter]);

  // Counts for chips
  const chipCounts = React.useMemo(() => {
    return {
      all: notifications.filter((n) => n.status !== 'archived').length,
      unread: notifications.filter((n) => n.status === 'unread').length,
      gov: notifications.filter((n) => n.category === 'gov' && n.status !== 'archived').length,
      customers: notifications.filter((n) => n.category === 'customers' && n.status !== 'archived').length,
      marketing: notifications.filter((n) => n.category === 'marketing' && n.status !== 'archived').length,
      business: notifications.filter((n) => n.category === 'business' && n.status !== 'archived').length,
      archived: notifications.filter((n) => n.status === 'archived').length,
    };
  }, [notifications]);

  // Filter by channel and search query
  const filteredNotifications = React.useMemo(() => {
    let list = baseActiveList;

    if (activeChannel !== 'all') {
      list = list.filter((n) => (n.channel || 'amob') === activeChannel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.sender_name.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          (n.body && n.body.toLowerCase().includes(q))
      );
    }

    return list;
  }, [baseActiveList, activeChannel, searchQuery]);

  return (
    <div
      className={`flex flex-col h-full bg-panel border border-border/40 rounded-card p-3 overflow-hidden gap-2.5 w-[340px] lg:w-[400px] shrink-0 ${className}`}
    >
      {/* Header row: "Inbox" with unread count, then + New, Refresh IconButton, and Mark all read button */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-semibold text-text truncate">
            Inbox {unreadCount > 0 && <span className="text-xs text-primary font-bold">({unreadCount})</span>}
          </span>
          {onNewConversation && (
            <Button
              type="button"
              intent="primary"
              size="sm"
              onClick={onNewConversation}
              className="h-6 px-2.5 text-xs font-semibold gap-1 rounded-full shadow-2xs"
              leftIcon={<Plus size={12} />}
            >
              New
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onRefresh && (
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh notifications"
              intent="ghost"
              size="sm"
              onClick={onRefresh}
            />
          )}

          <Dropdown
            isOpen={isChannelDropdownOpen}
            onClose={() => setIsChannelDropdownOpen(false)}
            trigger={
              <IconButton
                icon={<Filter size={14} className={activeChannel !== 'all' ? 'text-primary' : ''} />}
                label="Filter channels"
                intent="ghost"
                size="sm"
                onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
                className="relative"
              >
                {activeChannel !== 'all' && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </IconButton>
            }
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  setActiveChannel(opt.value);
                  setIsChannelDropdownOpen(false);
                }}
              />
            ))}
          </Dropdown>

          {onMarkAllRead && (
            <IconButton
              icon={<CheckCheck size={16} />}
              label="Mark all read"
              intent="ghost"
              size="sm"
              onClick={onMarkAllRead}
            />
          )}
        </div>
      </div>

      {/* Search directly below */}
      <div className="shrink-0">
        <SearchInput
          placeholder="Search inbox..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* One filter row, horizontally scrollable chip row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0 scrollbar-hidden">
        {FILTER_CHIPS.map((chip) => {
          const isActive = categoryFilter === chip.value;
          let count = 0;
          if (chip.value === null) count = chipCounts.all;
          else if (chip.value === 'unread') count = chipCounts.unread;
          else if (chip.value === 'gov') count = chipCounts.gov;
          else if (chip.value === 'customers') count = chipCounts.customers;
          else if (chip.value === 'marketing') count = chipCounts.marketing;
          else if (chip.value === 'business') count = chipCounts.business;
          else if (chip.value === 'archived') count = chipCounts.archived;

          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onCategoryChange?.(chip.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 border
                ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                    : 'bg-panel-strong/40 text-text-muted hover:text-text border-border/30 hover:bg-panel-strong'
                }
              `}
            >
              <span>{chip.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-panel border border-border/30 text-text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List rows (gap of 2px, padding px-3 py-2.5) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hidden flex flex-col gap-0.5">
        {filteredNotifications.length === 0 ? (
          <div className="my-auto p-4">
            <EmptyState
              variant={searchQuery.trim() ? 'filtered' : 'empty'}
              description={searchQuery.trim() ? `No matches for "${searchQuery}"` : undefined}
              compact
            />
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isMenuOpen = contextMenuId === item.id;
            return (
              <Dropdown
                key={item.id}
                isOpen={isMenuOpen}
                onClose={() => setContextMenuId(null)}
                className="w-full"
                trigger={
                  <NotificationListItem
                    notification={item}
                    isSelected={item.id === selectedId}
                    onClick={() => onSelectNotification(item.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuId(isMenuOpen ? null : item.id);
                    }}
                  />
                }
              >
                <DropdownMenuItem
                  label="Open"
                  icon={<MailOpen size={14} />}
                  onClick={() => {
                    setContextMenuId(null);
                    onSelectNotification(item.id);
                  }}
                />

                <Tooltip content="Forward message" position="right">
                  <div className="w-full">
                    <DropdownMenuItem label="Forward" icon={<Share2 size={14} />} disabled />
                  </div>
                </Tooltip>

                {item.status !== 'archived' && (
                  <DropdownMenuItem
                    label="Archive"
                    icon={<Archive size={14} />}
                    onClick={() => {
                      setContextMenuId(null);
                      onArchiveNotification(item.id);
                    }}
                  />
                )}

                <DropdownMenuItem
                  label="Delete Permanently"
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    setContextMenuId(null);
                    onDeleteNotification(item.id);
                  }}
                />
              </Dropdown>
            );
          })
        )}
      </div>
    </div>
  );
};
