import * as React from 'react';
import { Panel, Button, IconButton, Textarea, Tooltip } from '@40labs/ui-components';
import { Mail, Send, Paperclip, Smile, Mic, FileText, Image as ImageIcon, Camera, User, BarChart2, X, Tag } from 'lucide-react';
import type { Notification, NotificationAttachment } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { CAN_REPLY_BY_CATEGORY } from '../replyPolicy';
import { ConversationHeader } from './ConversationHeader';
import { MessageBubble } from './MessageBubble';
import { DateSeparator } from './DateSeparator';
import { useNotificationMessages } from '../../../hooks/useNotifications';

export interface AttachmentItem extends NotificationAttachment {}

export interface NotificationDetailPanelProps {
  notification?: Notification | null;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendReply?: (id: string, replyText: string, attachments?: AttachmentItem[]) => void;
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
  const [replyText, setReplyText] = React.useState('');
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isNearBottomRef = React.useRef(true);

  const { messages } = useNotificationMessages(notification?.id || null);
  const channel = notification?.channel || 'amob';
  const channelCfg = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;
  const capabilities = channelCfg.capabilities;

  React.useEffect(() => {
    setReplyText('');
    setAttachments([]);
    setIsAttachMenuOpen(false);
  }, [notification?.id]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

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

  const handleAddAttachment = (type: 'image' | 'file' | 'audio') => {
    const id = Math.random().toString(36).substring(2, 9);
    let name = type === 'image' ? 'photo.png' : type === 'audio' ? 'voice.wav' : 'doc.pdf';
    setAttachments((prev) => [...prev, { id, type, name, size: '1.2 MB' }]);
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && attachments.length === 0) || !notification) return;
    onSendReply?.(notification.id, replyText.trim(), attachments);
    setReplyText('');
    setAttachments([]);
    setIsAttachMenuOpen(false);
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
        onScroll={handleScroll}
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

      <div className="p-3 bg-panel-strong/30 border-t border-border/30 shrink-0">
        {canReply ? (
          <div className="flex flex-col gap-2 relative">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-panel rounded-card border border-border/40">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-panel-strong px-2.5 py-1 rounded-full text-xs">
                    <FileText size={12} className="text-primary" />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAttachMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-44 bg-panel border border-border/40 rounded-card shadow-lg py-1 z-50 flex flex-col">
                <button type="button" onClick={() => { handleAddAttachment('file'); setIsAttachMenuOpen(false); }} className="px-3 py-1.5 text-xs text-left hover:bg-panel-strong flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Document
                </button>
                <button type="button" onClick={() => { handleAddAttachment('image'); setIsAttachMenuOpen(false); }} className="px-3 py-1.5 text-xs text-left hover:bg-panel-strong flex items-center gap-2">
                  <ImageIcon size={14} className="text-accent" /> Photo
                </button>
                <button type="button" onClick={() => { handleAddAttachment('audio'); setIsAttachMenuOpen(false); }} className="px-3 py-1.5 text-xs text-left hover:bg-panel-strong flex items-center gap-2">
                  <Mic size={14} className="text-warning" /> Audio
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-panel px-3 py-2 rounded-full border border-border/40 shadow-2xs">
              <IconButton icon={<Paperclip size={18} />} label="Attach" intent="ghost" size="sm" onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)} className="text-text-muted hover:text-text" />
              <IconButton icon={<Smile size={18} />} label="Emoji" intent="ghost" size="sm" onClick={() => setReplyText((p) => p + ' 👍')} className="text-text-muted hover:text-text" />
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                placeholder={`Type a message via ${channelCfg.displayName}...`}
                className="flex-1 text-xs min-h-[36px] max-h-[100px] resize-none border-0 bg-transparent py-1 px-1 focus:ring-0 shadow-none leading-relaxed"
              />
              <IconButton icon={<Send size={14} className="text-white" />} label="Send" intent="primary" size="md" onClick={handleSendReply} className="rounded-full w-8 h-8 bg-primary hover:bg-primary-hover flex items-center justify-center" />
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 bg-panel-strong/40 border border-border/30 rounded-lg text-xs text-text-muted text-center">
            Sender: <strong className="text-text">{notification.sender_name}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
