import * as React from 'react';
import type { Thread, NotificationMessage, MessageAttachment } from '@40labs/types';
import { MessageBubble } from './MessageBubble';
import { Composer } from './composer/Composer';
import { ConversationHeader } from './ConversationHeader';
import { DateSeparator } from './DateSeparator';
import { Upload, ChevronDown } from 'lucide-react';
import { canReplyToThread } from '../replyPolicy';
import { notificationsApi } from '../../../api/notificationsApi';
import { useToast } from '../../../hooks/useToast';

export interface ChatPaneProps {
  thread: Thread | null;
  messages: NotificationMessage[];
  onSendReply: (body: string, attachmentIds?: string[]) => Promise<void>;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  thread,
  messages,
  onSendReply,
  onArchive,
  onDelete,
}) => {
  const { toast } = useToast();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [attachments, setAttachments] = React.useState<MessageAttachment[]>([]);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);

  // Auto-scroll only when near bottom
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!thread) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-panel text-text-muted p-8 text-center">
        <p className="text-sm">No Conversation Selected</p>
      </div>
    );
  }

  const isReadOnly = !canReplyToThread(thread.counterparty_type);

  const syntheticNotification = {
    id: thread.id,
    workspace_id: thread.workspace_id,
    branch_id: thread.branch_id,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    category: 'business' as const,
    source_type: 'local' as const,
    sender_name: thread.display_name,
    sender_business_id: thread.counterparty_key,
    subject: thread.display_name,
    body: thread.last_message_preview || '',
    status: 'read' as const,
    channel: 'amob' as const,
    received_at: thread.last_message_at,
    thread_id: thread.id,
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find first unread incoming message index
  const firstUnreadIndex = messages.findIndex((m) => m.direction === 'incoming' && m.status !== 'read');
  const unreadCount = messages.filter((m) => m.direction === 'incoming' && m.status !== 'read').length;

  return (
    <div
      className="flex-1 h-full flex flex-col bg-surface-secondary/20 overflow-hidden relative"
      onDragOver={(e) => { e.preventDefault(); if (!isReadOnly) setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isReadOnly) return;
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`File "${file.name}" exceeds 25 MB limit.`);
            continue;
          }
          const buffer = await file.arrayBuffer();
          const saved = await notificationsApi.saveAttachment({
            messageId: 'temp',
            kind: file.type.startsWith('image/') ? 'image' : 'file',
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            bytes: Array.from(new Uint8Array(buffer)),
          });
          setAttachments((prev) => [...prev, saved]);
        }
      }}
      onPaste={async (e) => {
        if (isReadOnly) return;
        const items = e.clipboardData.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (!file) continue;
            const buffer = await file.arrayBuffer();
            const saved = await notificationsApi.saveAttachment({
              messageId: 'temp',
              kind: 'image',
              fileName: `pasted_${Date.now()}.png`,
              mimeType: file.type,
              bytes: Array.from(new Uint8Array(buffer)),
            });
            setAttachments((prev) => [...prev, saved]);
          }
        }
      }}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-primary">
          <Upload size={40} className="text-primary animate-bounce mb-2" />
          <span className="text-sm font-bold text-text-primary">Drop files here to attach</span>
        </div>
      )}

      {/* Header */}
      <ConversationHeader
        notification={syntheticNotification as any}
        onArchive={onArchive}
        onDelete={onDelete}
      />

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 relative"
      >
        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : undefined;
          const currentDateLabel = formatDateLabel(msg.sent_at);
          const prevDateLabel = prevMsg ? formatDateLabel(prevMsg.sent_at) : null;
          const showDateSeparator = currentDateLabel !== prevDateLabel;
          const showUnreadDivider = idx === firstUnreadIndex && unreadCount > 0;

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && <DateSeparator date={currentDateLabel} />}
              {showUnreadDivider && (
                <div className="flex items-center justify-center my-3">
                  <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-[11px] font-bold">
                    {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <MessageBubble message={msg} previousMessage={prevMsg} />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 z-30 p-2 rounded-full bg-primary text-white shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* Fixed Composer */}
      <Composer
        onSend={(body, atts) => onSendReply(body, atts)}
        isReadOnly={isReadOnly}
        attachments={attachments}
        onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
        onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
      />
    </div>
  );
};
