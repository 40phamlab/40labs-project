import * as React from 'react';
import type { Thread, NotificationMessage, MessageAttachment } from '@40labs/types';
import { MessageBubble } from './MessageBubble';
import { Composer } from './composer/Composer';
import { getInitials } from './ThreadListItem';
import { Archive, Trash2, Upload } from 'lucide-react';
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

export const ChatPane: React.FC<ChatPaneProps> = ({
  thread,
  messages,
  onSendReply,
  onArchive,
  onDelete,
}) => {
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [attachments, setAttachments] = React.useState<MessageAttachment[]>([]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!thread) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-panel text-text-muted p-8 text-center">
        <p className="text-sm">No Conversation Selected</p>
      </div>
    );
  }

  const isReadOnly = !canReplyToThread(thread.counterparty_type);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
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

      try {
        const buffer = await file.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

        const saved = await notificationsApi.saveAttachment({
          messageId: 'temp',
          kind,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          bytes,
        });
        setAttachments((prev) => [...prev, saved]);
      } catch (err: any) {
        toast.error(err?.message || `Failed to attach ${file.name}`);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (isReadOnly) return;
    const items = e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > MAX_FILE_SIZE) {
          toast.error('Pasted image exceeds 25 MB limit.');
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buffer));
          const saved = await notificationsApi.saveAttachment({
            messageId: 'temp',
            kind: 'image',
            fileName: `pasted_image_${Date.now()}.png`,
            mimeType: file.type || 'image/png',
            bytes,
          });
          setAttachments((prev) => [...prev, saved]);
        } catch (err: any) {
          toast.error('Failed to attach pasted image.');
        }
      }
    }
  };

  return (
    <div
      className="flex-1 h-full flex flex-col bg-surface-secondary/20 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-primary">
          <Upload size={40} className="text-primary animate-bounce mb-2" />
          <span className="text-sm font-bold text-text-primary">Drop files here to attach</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-panel border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
            {getInitials(thread.display_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text-primary">{thread.display_name}</h3>
              {isReadOnly && <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning text-[9px] font-bold">Read-Only</span>}
            </div>
            <span className="text-[10px] font-mono text-text-muted capitalize">{thread.counterparty_type} channel</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onArchive(thread.id)}
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
            title="Archive Thread"
          >
            <Archive size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(thread.id)}
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-danger"
            title="Delete Thread"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

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
