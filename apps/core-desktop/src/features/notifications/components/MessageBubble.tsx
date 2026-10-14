import * as React from 'react';
import type { NotificationMessage } from '@40labs/types';
import { useFilePreviewContext } from '../../../providers/FilePreviewProvider';
import { notificationsApi } from '../../../api/notificationsApi';
import { useToast } from '../../../hooks/useToast';
import { Download, ExternalLink } from 'lucide-react';

export interface MessageBubbleProps {
  message: NotificationMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOutgoing = message.direction === 'outgoing';
  const { openAttachment } = useFilePreviewContext();
  const { toast } = useToast();

  const handleExport = async (attId: string, fileName: string) => {
    try {
      await notificationsApi.exportAttachment(attId, 'attachments');
      toast.success(`Saved "${fileName}" to Documents/40Labs/attachments`);
    } catch (err) {
      toast.error('Failed to save attachment.');
    }
  };

  return (
    <div className={`flex w-full my-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs space-y-1.5 ${
          isOutgoing
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-panel-strong text-text-primary rounded-bl-none border border-border/40'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>

        {message.attachments && message.attachments.map((att) => (
          <div
            key={att.id}
            className="p-2 rounded bg-black/10 hover:bg-black/20 flex items-center justify-between gap-2 text-[11px]"
          >
            <span
              onClick={() => openAttachment(att)}
              className="cursor-pointer flex items-center gap-1.5 truncate flex-1 font-medium"
            >
              📎 {att.file_name}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openAttachment(att)}
                className="p-1 rounded hover:bg-black/20"
                title="Preview"
              >
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleExport(att.id, att.file_name)}
                className="p-1 rounded hover:bg-black/20"
                title="Save As"
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        ))}

        <div className={`text-[9px] flex justify-end gap-1 font-mono ${isOutgoing ? 'text-white/80' : 'text-text-muted'}`}>
          <span>{new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOutgoing && (
            <span>
              {message.status === 'sent' || message.status === 'delivered' || message.status === 'read'
                ? '✓✓'
                : message.status === 'queued'
                ? '🕒'
                : '•'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
