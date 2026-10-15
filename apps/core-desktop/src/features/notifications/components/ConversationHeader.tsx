import * as React from 'react';
import { IconButton, Dropdown, DropdownMenuItem, Tooltip } from '@40labs/ui-components';
import { ChevronLeft, Archive, MoreVertical, CheckCircle2, Trash2 } from 'lucide-react';
import type { Notification, MessageChannel } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { ChannelBadge } from './ChannelIndicator';
import { NotificationAvatar } from './NotificationAvatar';

export interface ConversationHeaderProps {
  notification: Notification;
  counterpartyType?: string;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBack?: () => void;
  className?: string;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  notification,
  counterpartyType,
  onMarkAsRead,
  onArchive,
  onDelete,
  onBack,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const channel = (notification.channel || 'amob') as MessageChannel;
  const channelCfg = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;
  const resolvedCounterpartyType = counterpartyType || (notification as any).counterparty_type || notification.category;

  return (
    <div className={`h-[60px] bg-tab-panel-strong flex items-center justify-between px-4 border-b border-border/40 shrink-0 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <IconButton
            icon={<ChevronLeft size={18} />}
            label="Back to inbox"
            intent="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0 text-text-muted hover:text-text -ml-2"
          />
        )}
        <NotificationAvatar
          name={notification.sender_name}
          counterpartyType={resolvedCounterpartyType}
          size="md"
          className="shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-[15px] font-semibold text-text truncate">
              {notification.sender_name}
            </h2>
            <ChannelBadge channel={channel} size="sm" />
          </div>
          <span className="text-xs font-mono text-text-muted truncate">
            {channelCfg.displayName} {notification.sender_business_id ? `· ${notification.sender_business_id}` : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onArchive && notification.status !== 'archived' && (
          <Tooltip content="Archive conversation">
            <IconButton
              icon={<Archive size={16} />}
              label="Archive"
              intent="ghost"
              size="sm"
              onClick={() => onArchive(notification.id)}
              className="text-text-muted hover:text-text"
            />
          </Tooltip>
        )}

        <Dropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          trigger={
            <IconButton
              icon={<MoreVertical size={16} />}
              label="More options"
              intent="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-muted hover:text-text"
            />
          }
        >
          {onMarkAsRead && notification.status === 'unread' && (
            <DropdownMenuItem
              label="Mark as read"
              icon={<CheckCircle2 size={14} />}
              onClick={() => {
                setIsMenuOpen(false);
                onMarkAsRead(notification.id);
              }}
            />
          )}
          {onDelete && (
            <DropdownMenuItem
              label="Delete conversation"
              icon={<Trash2 size={14} />}
              variant="danger"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(notification.id);
              }}
            />
          )}
        </Dropdown>
      </div>
    </div>
  );
};
