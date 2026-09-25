import * as React from 'react';
import {
  Dropdown,
  DropdownMenuItem,
  Button,
  Panel,
  Tooltip,
} from '@40labs/ui-components';
import { ChevronDown, MailOpen, Share2, Trash2, Flag } from 'lucide-react';
import type { Notification } from '@40labs/types';
import { NotificationListItem } from './NotificationListItem';

export interface NotificationsListPanelProps {
  notifications: Notification[];
  selectedId?: string | null;
  categoryFilter?: string | null;
  onSelectNotification: (id: string) => void;
  onCategoryChange?: (category: string | null) => void;
  onDeleteNotification: (id: string) => void;
  className?: string;
}

const FILTER_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'ALL', value: null },
  { label: 'Gov', value: 'gov' },
  { label: 'Customers', value: 'customers' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Business', value: 'business' },
];

export const NotificationsListPanel: React.FC<NotificationsListPanelProps> = ({
  notifications,
  selectedId,
  categoryFilter,
  onSelectNotification,
  onCategoryChange,
  onDeleteNotification,
  className = '',
}) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);

  // Filter notifications by active category filter
  const filteredNotifications = React.useMemo(() => {
    if (!categoryFilter) return notifications;
    if (categoryFilter === 'unread') {
      return notifications.filter((n) => n.status === 'unread');
    }
    return notifications.filter((n) => n.category === categoryFilter);
  }, [notifications, categoryFilter]);

  const currentFilterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === categoryFilter)?.label ||
    (categoryFilter ? categoryFilter.toUpperCase() : 'ALL');

  const getEmptyMessage = () => {
    if (categoryFilter) {
      return `No notifications found under "${categoryFilter}".`;
    }
    return 'No notifications available.';
  };

  return (
    <div
      className={`flex flex-col h-full bg-panel border border-border/30 rounded-card p-4 overflow-hidden gap-3 ${className}`}
    >
      {/* Header with Filter Dropdown */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-border/30">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Inbox ({filteredNotifications.length})
        </span>

        {/* Category Filter Dropdown */}
        <Dropdown
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          trigger={
            <Button
              type="button"
              intent="neutral"
              size="sm"
              className="flex items-center gap-1.5 uppercase font-bold text-xs"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span>{currentFilterLabel}</span>
              <ChevronDown size={14} />
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

      {/* Notifications List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2">
        {filteredNotifications.length === 0 ? (
          <Panel
            variant="flat"
            className="p-8 text-center border border-dashed border-border/40 rounded-card my-auto"
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

                <DropdownMenuItem
                  label="Delete"
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
