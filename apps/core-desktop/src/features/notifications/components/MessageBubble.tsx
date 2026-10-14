import * as React from 'react';
import type { NotificationMessage } from '@40labs/types';
import { useFilePreviewContext } from '../../../providers/FilePreviewProvider';

export interface MessageBubbleProps {
  message: NotificationMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOutgoing = message.direction === 'outgoing';
  const { openBlob } = useFilePreviewContext();

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
            onClick={() => {
              fetch(att.storage_path)
                .then(res => res.blob())
                .then(blob => openBlob({ fileName: att.file_name, mimeType: att.mime_type, blob }))
                .catch(() => {});
            }}
            className="p-2 rounded bg-black/10 hover:bg-black/20 cursor-pointer flex items-center gap-2 text-[11px]"
          >
            <span>📎 {att.file_name}</span>
          </div>
        ))}

        <div className={`text-[9px] flex justify-end gap-1 font-mono ${isOutgoing ? 'text-white/80' : 'text-text-muted'}`}>
          <span>{new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOutgoing && <span>{message.status === 'sent' || message.status === 'delivered' ? '✓✓' : '•'}</span>}
        </div>
      </div>
    </div>
  );
};
