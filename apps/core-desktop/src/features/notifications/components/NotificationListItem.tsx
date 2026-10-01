import * as React from 'react';
import { Avatar } from '@40labs/ui-components';
import type { Notification } from '@40labs/types';
import { ChannelIcon } from './ChannelIndicator';

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

function getSenderTone(key: string): 'primary' | 'accent' | 'danger' | 'neutral' {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SENDER_TONES.length;
  return SENDER_TONES[index];
}

function stripMarkdownAndHtml(text: string): string {
  if (!text) return '';
  let clean = text.replace(/<[^>]*>/g, '');
  clean = clean.replace(/#{1,6}\s+/g, '');
  clean = clean.replace(/(\*\*|\*|__|`)/g, '');
  clean = clean.replace(/^>\s+/gm, '');
  return clean.trim();
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
  const previewText = stripMarkdownAndHtml(notification.body || notification.subject);

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 h-[72px] rounded-card transition-colors cursor-pointer border min-w-0
        ${
          isSelected
            ? 'bg-panel-strong border-border/50 shadow-xs'
            : 'bg-panel border-border/30 hover:bg-panel-strong/60'
        }
        ${className}
      `}
    >
      {/* 44px Avatar */}
      <div className="w-11 h-11 shrink-0 flex items-center justify-center">
        <Avatar name={notification.sender_name} tone={tone} size="lg" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className={`text-[15px] truncate ${
              isUnread ? 'font-semibold text-text' : 'font-medium text-text/90'
            }`}
          >
            {notification.sender_name}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <ChannelIcon channel={notification.channel || 'amob'} size={13} />
            {isUnread && (
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                title="Unread notification"
              />
            )}
            <span className={`text-xs font-mono ${isUnread ? 'font-semibold text-text' : 'text-text-muted'}`}>
              {timeDisplay}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[13px] text-text-muted truncate">
            {previewText}
          </p>
        </div>
      </div>
    </div>
  );
};
