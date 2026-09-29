import * as React from 'react';
import {
  Dropdown,
  DropdownMenuItem,
  Button,
  Panel,
  Tooltip,
  SearchInput,
  IconButton,
} from '@40labs/ui-components';
import { ChevronDown, MailOpen, Share2, Trash2, Archive, CheckCheck, RefreshCw, Plus } from 'lucide-react';
import type { Notification, MessageChannel } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { NotificationListItem } from './NotificationListItem';
import { ChannelIcon } from './ChannelIndicator';

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

const FILTER_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'All Active', value: null },
  { label: 'Unread', value: 'unread' },
  { label: 'Gov', value: 'gov' },
  { label: 'Customers', value: 'customers' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Business', value: 'business' },
  { label: 'Archived', value: 'archived' },
];

const CHANNEL_FILTER_OPTIONS: Array<{ label: string; value: 'all' | MessageChannel }> = [
  { label: 'All', value: 'all' },
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
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localChannelFilter, setLocalChannelFilter] = React.useState<'all' | MessageChannel>('all');

  const activeChannel = channelFilter !== undefined ? channelFilter : localChannelFilter;
  const setActiveChannel = onChannelChange || setLocalChannelFilter;

  // Compute base active list (excluding archived unless explicitly requested)
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

  // Channel counts based on active non-archived notifications (or current category filter)
  const channelCounts = React.useMemo(() => {
    const counts: Record<'all' | MessageChannel, number> = {
      all: baseActiveList.length,
      amob: baseActiveList.filter((n) => (n.channel || 'amob') === 'amob').length,
      whatsapp: baseActiveList.filter((n) => n.channel === 'whatsapp').length,
      sms: baseActiveList.filter((n) => n.channel === 'sms').length,
      email: baseActiveList.filter((n) => n.channel === 'email').length,
    };
    return counts;
  }, [baseActiveList]);

  // Filter notifications by channel and search query
  const filteredNotifications = React.useMemo(() => {
    let list = baseActiveList;

    // Channel filtering
    if (activeChannel !== 'all') {
      list = list.filter((n) => (n.channel || 'amob') === activeChannel);
    }

    // Search filtering
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

  const currentFilterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === categoryFilter)?.label ||
    (categoryFilter ? categoryFilter.toUpperCase() : 'ALL ACTIVE');

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No notifications matching "${searchQuery}".`;
    }
    if (activeChannel !== 'all') {
      const channelName = CHANNEL_CONFIGS[activeChannel]?.displayName || activeChannel;
      return `No ${channelName} conversations\nThere are no conversations for this channel.`;
    }
    if (categoryFilter) {
      return `No notifications found under "${categoryFilter}".`;
    }
    return 'No active notifications available.';
  };

  return (
    <div
      className={`flex flex-col h-full bg-panel border border-border/40 rounded-card p-3 overflow-hidden gap-2.5 ${className}`}
    >
      {/* Header with Title, New Button and Actions */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Inbox ({filteredNotifications.length})
          </span>
          {onNewConversation && (
            <Tooltip content="Start new conversation">
              <Button
                type="button"
                intent="primary"
                size="sm"
                onClick={onNewConversation}
                className="h-6 px-2 text-[11px] font-semibold gap-1 shadow-2xs rounded-full"
                leftIcon={<Plus size={12} />}
              >
                New
              </Button>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onMarkAllRead && (
            <Tooltip content="Mark all as read" position="bottom">
              <Button
                type="button"
                intent="neutral"
                size="sm"
                onClick={onMarkAllRead}
                className="h-7 px-2 text-[11px]"
                leftIcon={<CheckCheck size={12} />}
              >
                Mark Read
              </Button>
            </Tooltip>
          )}
          {onRefresh && (
            <IconButton
              icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh notifications"
              intent="ghost"
              size="sm"
              onClick={onRefresh}
            />
          )}
        </div>
      </div>

      {/* Search and Category Filter Row */}
      <div className="flex flex-col gap-2 shrink-0">
        <SearchInput
          placeholder="Search inbox..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />

        {/* Category Filter Dropdown */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted font-medium">Category:</span>
          <Dropdown
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            trigger={
              <Button
                type="button"
                intent="neutral"
                size="sm"
                className="flex items-center gap-1.5 uppercase font-bold text-[11px] h-7 px-2.5"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span>{currentFilterLabel}</span>
                <ChevronDown size={12} />
              </Button>
            }
          >
            {FILTER_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.label}
                label={opt.label}
                onClick={() => {
                  onCategoryChange?.(opt.value);
                  setIsFilterOpen(false);
                }}
              />
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Channel Filter Segmented / Pill Bar with Counts */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
        {CHANNEL_FILTER_OPTIONS.map((opt) => {
          const isActive = activeChannel === opt.value;
          const count = channelCounts[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveChannel(opt.value)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 border
                ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                    : 'bg-panel-strong/40 text-text-muted hover:text-text border-border/30 hover:bg-panel-strong'
                }
              `}
            >
              {opt.value !== 'all' && <ChannelIcon channel={opt.value} size={11} className={isActive ? 'text-white' : ''} />}
              <span>{opt.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-panel border border-border/30 text-text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1.5">
        {filteredNotifications.length === 0 ? (
          <Panel
            variant="flat"
            className="p-6 text-center border border-dashed border-border/40 rounded-card my-auto flex flex-col items-center gap-2"
          >
            <p className="text-xs font-bold text-text">
              {activeChannel !== 'all'
                ? `No ${CHANNEL_CONFIGS[activeChannel]?.displayName || activeChannel} conversations`
                : 'No conversations found'}
            </p>
            <p className="text-[11px] text-text-muted">
              {activeChannel !== 'all'
                ? 'There are no conversations for this channel.'
                : getEmptyMessage()}
            </p>
            {activeChannel !== 'all' && (
              <Button
                type="button"
                intent="neutral"
                size="sm"
                onClick={() => setActiveChannel('all')}
                className="mt-1 h-7 text-xs"
              >
                Return to All Channels
              </Button>
            )}
          </Panel>
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

                <Tooltip
                  content="Coming soon — cross-business messaging required"
                  position="right"
                >
                  <div className="w-full">
                    <DropdownMenuItem
                      label="Forward"
                      icon={<Share2 size={14} />}
                      disabled
                    />
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
