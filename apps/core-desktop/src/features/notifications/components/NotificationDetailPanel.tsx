import * as React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Panel,
  Avatar,
  Badge,
  Button,
  IconButton,
  Textarea,
} from '@40labs/ui-components';
import {
  Mail,
  Building2,
  Tag,
  CheckCircle2,
  Archive,
  Trash2,
  Send,
} from 'lucide-react';
import type { Notification, NotificationCategory } from '@40labs/types';
import { CAN_REPLY_BY_CATEGORY } from '../replyPolicy';

export interface NotificationDetailPanelProps {
  notification?: Notification | null;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendReply?: (id: string, replyText: string) => void;
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

const categoryBadgeVariants: Record<
  NotificationCategory,
  'warning' | 'primary' | 'neutral' | 'surface'
> = {
  gov: 'warning',
  customers: 'primary',
  marketing: 'neutral',
  business: 'surface',
};

export const NotificationDetailPanel: React.FC<NotificationDetailPanelProps> = ({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSendReply,
  className = '',
}) => {
  const [replyText, setReplyText] = React.useState('');

  // Clear unsent reply text whenever notification selection changes
  React.useEffect(() => {
    setReplyText('');
  }, [notification?.id]);

  if (!notification) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-panel border border-border/50 rounded-card elevation-raised p-8 text-center">
          <Panel variant="flat" className="p-6 max-w-sm mx-auto flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
              <Mail size={24} />
            </div>
            <h3 className="text-sm font-bold text-text">No Notification Selected</h3>
            <p className="text-xs text-text-muted">
              Select a notification from the list to view its details and message contents.
            </p>
          </Panel>
        </Card>
      </div>
    );
  }

  const senderKey = notification.sender_business_id ?? notification.sender_name;
  const tone = getSenderTone(senderKey);
  const hasBody = Boolean(notification.body && notification.body.trim().length > 0);
  const canReply = CAN_REPLY_BY_CATEGORY[notification.category] ?? false;

  const handleSendReply = () => {
    if (!replyText.trim() || !notification) return;
    onSendReply?.(notification.id, replyText.trim());
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center p-4 overflow-y-auto custom-scrollbar ${className}`}>
      <Card className="w-full max-w-2xl max-h-full flex flex-col bg-panel border border-border/50 rounded-card elevation-raised overflow-hidden">
        {/* Header Section */}
        <CardHeader className="bg-panel-strong/40 flex flex-col gap-3 p-4 border-b border-border/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={categoryBadgeVariants[notification.category] || 'neutral'}>
                {notification.category}
              </Badge>
              {notification.status === 'unread' && (
                <Badge variant="primary" size="sm">
                  Unread
                </Badge>
              )}
            </div>

            <span className="text-xs text-text-muted font-mono">
              {new Date(notification.received_at || notification.created_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          {/* Sender Info */}
          <div className="flex items-center gap-3">
            <Avatar name={notification.sender_name} tone={tone} size="lg" />
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-bold text-text truncate">
                {notification.sender_name}
              </h2>
              {notification.sender_business_id && (
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                  <Building2 size={12} /> ID: {notification.sender_business_id}
                </span>
              )}
            </div>
          </div>

          {/* Subject */}
          <h1 className="text-base font-bold text-text mt-1">{notification.subject}</h1>
        </CardHeader>

        {/* Body Content Section */}
        <CardBody className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
          {hasBody ? (
            <Panel
              variant="inset"
              className="p-4 bg-panel-strong/40 border border-border/20 rounded-card text-xs text-text leading-relaxed whitespace-pre-wrap font-ui"
            >
              {notification.body}
            </Panel>
          ) : (
            <Panel
              variant="flat"
              className="p-8 text-center border border-dashed border-border/40 rounded-card"
            >
              <p className="text-xs text-text-muted italic">
                No additional message body content provided.
              </p>
            </Panel>
          )}

          {/* Related Entity Reference */}
          {notification.related_entity_type && (
            <Panel
              variant="flat"
              className="p-3 bg-panel-strong/30 border border-border/30 rounded-card flex items-center justify-between text-xs shrink-0"
            >
              <div className="flex items-center gap-2 text-text-muted">
                <Tag size={14} />
                <span>
                  Related Entity: <strong className="text-text">{notification.related_entity_type}</strong>
                </span>
                {notification.related_entity_id && (
                  <span className="font-mono text-[11px]">({notification.related_entity_id})</span>
                )}
              </div>
            </Panel>
          )}
        </CardBody>

        {/* Reply Composer or Non-repliable Notice */}
        <div className="p-3 bg-panel-strong/30 border-t border-border/30 shrink-0">
          {canReply ? (
            <div className="flex items-end gap-2 bg-panel p-2 rounded-card border border-border/40">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply... (Ctrl+Enter to send)"
                className="flex-1 text-xs min-h-[60px] max-h-[120px] resize-none border-0 bg-transparent p-1 focus:ring-0 shadow-none"
              />
              <IconButton
                icon={<Send size={16} />}
                label="Send Reply"
                intent="primary"
                size="md"
                disabled={!replyText.trim()}
                onClick={handleSendReply}
                className="shrink-0 rounded-full"
              />
            </div>
          ) : (
            <p className="text-xs text-text-muted italic text-center py-1">
              This sender doesn't accept replies in-app.
            </p>
          )}
        </div>

        {/* Action Buttons Footer */}
        {(onMarkAsRead || onArchive || onDelete) && (
          <CardFooter className="flex items-center justify-between gap-2 p-3 bg-panel-strong/20 border-t border-border/30 shrink-0">
            <div className="flex items-center gap-2">
              {onMarkAsRead && notification.status === 'unread' && (
                <Button
                  type="button"
                  intent="neutral"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs"
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Mark as Read
                </Button>
              )}
              {onArchive && notification.status !== 'archived' && (
                <Button
                  type="button"
                  intent="neutral"
                  size="sm"
                  onClick={() => onArchive(notification.id)}
                  className="text-xs"
                >
                  <Archive size={14} className="mr-1.5" /> Archive
                </Button>
              )}
            </div>

            {onDelete && (
              <Button
                type="button"
                intent="danger"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="text-xs"
              >
                <Trash2 size={14} className="mr-1.5" /> Delete
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
