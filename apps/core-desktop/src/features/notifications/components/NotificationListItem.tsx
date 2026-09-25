import * as React from 'react';
import { Avatar } from '@40labs/ui-components';
import type { Notification } from '@40labs/types';

export interface NotificationListItemProps {
  notification: Notification;
  isSelected?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

const SENDER_TONES: Array<'primary' | 'accent' | 'danger' | 'neutral'> = [
  'primary',
  'accent',
  'danger',
  'neutral',
];

/**
 * Deterministic tone mapping based on sender_business_id or sender_name.
 */
function getSenderTone(key: string): 'primary' | 'accent' | 'danger' | 'neutral' {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SENDER_TONES.length;
  return SENDER_TONES[index];
}

function formatNotificationTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 && diffDays > 0) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  isSelected = false,
  onClick,
  onContextMenu,
  className = '',
}) => {
  const senderKey = notification.sender_business_id ?? notification.sender_name;
  const tone = getSenderTone(senderKey);
  const isUnread = notification.status === 'unread';
  const timeDisplay = formatNotificationTime(notification.received_at || notification.created_at);

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      className={`
        group relative flex items-start gap-3 p-3 rounded-card transition-colors cursor-pointer border
        ${
          isSelected
            ? 'bg-panel-strong border-border/50 shadow-sm'
            : 'bg-panel border-border/30 hover:bg-panel-strong/60'
        }
        ${className}
      `}
    >
      {/* Sender Avatar */}
      <Avatar name={notification.sender_name} tone={tone} size="md" className="shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs truncate ${
              isUnread ? 'font-bold text-text' : 'font-medium text-text/90'
            }`}
          >
            {notification.sender_name}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {isUnread && (
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                title="Unread notification"
              />
            )}
            <span className="text-[10px] text-text-muted font-mono">{timeDisplay}</span>
          </div>
        </div>

        <p
          className={`text-xs truncate ${
            isUnread ? 'font-semibold text-text' : 'text-text-muted'
          }`}
        >
          {notification.subject}
        </p>

        {notification.body && (
          <p className="text-[11px] text-text-muted line-clamp-1 opacity-80">
            {notification.body}
          </p>
        )}
      </div>
    </div>
  );
};
