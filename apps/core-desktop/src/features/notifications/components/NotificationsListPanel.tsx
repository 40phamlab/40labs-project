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
import { ChevronDown, MailOpen, Share2, Trash2, Archive, Flag, CheckCheck, RefreshCw } from 'lucide-react';
import type { Notification } from '@40labs/types';
import { NotificationListItem } from './NotificationListItem';

export interface NotificationsListPanelProps {
  notifications: Notification[];
  selectedId?: string | null;
  categoryFilter?: string | null;
  onSelectNotification: (id: string) => void;
  onCategoryChange?: (category: string | null) => void;
  onArchiveNotification: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllRead?: () => void;
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

export const NotificationsListPanel: React.FC<NotificationsListPanelProps> = ({
  notifications,
  selectedId,
  categoryFilter,
  onSelectNotification,
  onCategoryChange,
  onArchiveNotification,
  onDeleteNotification,
  onMarkAllRead,
  isLoading = false,
  onRefresh,
  className = '',
}) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter notifications by active category filter and search query
  const filteredNotifications = React.useMemo(() => {
    let list = notifications;

    // Category filtering
    if (!categoryFilter) {
      list = list.filter((n) => n.status !== 'archived');
    } else if (categoryFilter === 'unread') {
      list = list.filter((n) => n.status === 'unread');
    } else if (categoryFilter === 'archived') {
      list = list.filter((n) => n.status === 'archived');
    } else {
      list = list.filter((n) => n.category === categoryFilter && n.status !== 'archived');
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
  }, [notifications, categoryFilter, searchQuery]);

  const currentFilterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === categoryFilter)?.label ||
    (categoryFilter ? categoryFilter.toUpperCase() : 'ALL ACTIVE');

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No notifications matching "${searchQuery}".`;
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
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-border/30">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Inbox ({filteredNotifications.length})
        </span>

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

      {/* Search and Filter Row */}
      <div className="flex flex-col gap-2 shrink-0">
        <SearchInput
          placeholder="Search inbox..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />

        {/* Category Filter Dropdown */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted font-medium">Filter:</span>
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

      {/* Notifications List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1.5">
        {filteredNotifications.length === 0 ? (
          <Panel
            variant="flat"
            className="p-6 text-center border border-dashed border-border/40 rounded-card my-auto"
          >
            <p className="text-xs text-text-muted">{getEmptyMessage()}</p>
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

                <Tooltip
                  content="Coming soon — Admin Web App moderation workflow required."
                  position="right"
                >
                  <div className="w-full">
                    <DropdownMenuItem
                      label="Report"
                      icon={<Flag size={14} />}
                      disabled
                    />
                  </div>
                </Tooltip>
              </Dropdown>
            );
          })
        )}
      </div>
    </div>
  );
};
