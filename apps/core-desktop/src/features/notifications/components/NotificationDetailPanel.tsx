import * as React from 'react';
import { Panel } from '@40labs/ui-components';
import { Mail, Tag } from 'lucide-react';
import type { Notification } from '@40labs/types';
import { CAN_REPLY_BY_CATEGORY } from '../replyPolicy';
import { ConversationHeader } from './ConversationHeader';
import { MessageBubble } from './MessageBubble';
import { DateSeparator } from './DateSeparator';
import { Composer } from './composer/Composer';
import { useNotificationMessages } from '../../../hooks/useNotifications';

export interface NotificationDetailPanelProps {
  notification?: Notification | null;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendReply?: (id: string, replyText: string, attachmentIds?: string[]) => void;
  onBack?: () => void;
  className?: string;
}

function formatDateLabel(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Today';
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Today';
  }
}

export const NotificationDetailPanel: React.FC<NotificationDetailPanelProps> = ({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSendReply,
  onBack,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isNearBottomRef = React.useRef(true);

  const { messages, sendMessage } = useNotificationMessages(notification?.id || null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    const el = containerRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, notification?.id]);

  if (!notification) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-panel border border-border/40 rounded-card p-8 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-panel-strong/60 flex items-center justify-center text-text-muted mb-3 border border-border/30">
          <Mail size={24} />
        </div>
        <h3 className="text-[15px] font-semibold text-text mb-1">No Conversation Selected</h3>
      </div>
    );
  }

  const canReply = CAN_REPLY_BY_CATEGORY[notification.category] ?? false;

  const handleSend = async (text: string, attachmentIds: string[]) => {
    if (onSendReply) {
      onSendReply(notification.id, text, attachmentIds);
    } else {
      await sendMessage({
        notificationId: notification.id,
        body: text,
        attachmentIds,
      });
    }
  };

  const handleRetry = async (msg: any) => {
    await sendMessage({
      notificationId: notification.id,
      body: msg.body,
      attachmentIds: msg.attachments?.map((a: any) => a.id) || [],
    });
  };

  return (
    <div className={`w-full h-full flex flex-col bg-panel border border-border/40 rounded-card overflow-hidden shadow-xs ${className}`}>
      <ConversationHeader
        notification={notification}
        onMarkAsRead={onMarkAsRead}
        onArchive={onArchive}
        onDelete={onDelete}
        onBack={onBack}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar flex flex-col gap-2"
      >
        <div className="text-center py-1">
          <span className="text-xs font-semibold text-text bg-panel-strong/40 px-3 py-1 rounded-full border border-border/20">
            {notification.subject}
          </span>
        </div>

        <DateSeparator date={formatDateLabel(notification.received_at || notification.created_at)} />

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const isConsecutive = prevMsg && prevMsg.direction === msg.direction;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              senderName={msg.direction === 'outgoing' ? 'You' : notification.sender_name}
              channel={notification.channel}
              contentType={notification.content_type}
              isConsecutive={isConsecutive}
              onRetry={() => handleRetry(msg)}
            />
          );
        })}

        {notification.related_entity_type && (
          <Panel variant="flat" className="p-2.5 bg-panel-strong/30 border border-border/30 rounded-card flex items-center gap-2 text-xs text-text-muted my-2">
            <Tag size={13} />
            <span>Related Entity: <strong className="text-text">{notification.related_entity_type}</strong></span>
          </Panel>
        )}
      </div>

      {canReply ? (
        <Composer
          notificationId={notification.id}
          channel={notification.channel || 'amob'}
          onSend={handleSend}
        />
      ) : (
        <div className="p-3 bg-panel-strong/30 border-t border-border/30 text-xs text-text-muted text-center">
          Sender: <strong className="text-text">{notification.sender_name}</strong>
        </div>
      )}
    </div>
  );
};
