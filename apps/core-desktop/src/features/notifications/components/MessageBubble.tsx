import * as React from 'react';
import type { NotificationMessage } from '@40labs/types';
import { MessageStatusIcon } from './MessageStatusIcon';
import { MessageRenderer } from './renderers/MessageRenderer';

export interface MessageBubbleProps {
  message: NotificationMessage;
  senderName: string;
  channel?: string;
  contentType?: string;
  isConsecutive?: boolean;
  onRetry?: () => void;
  className?: string;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  senderName,
  channel = 'amob',
  contentType,
  isConsecutive = false,
  onRetry,
  className = '',
}) => {
  const isOutgoing = message.direction === 'outgoing';
  const timestamp = formatTime(message.sent_at || message.created_at);

  const attachments = message.attachments?.map((a) => ({
    id: a.id,
    type: a.kind as any,
    name: a.file_name,
    size: `${Math.round(a.size_bytes / 1024)} KB`,
    url: a.url,
    durationMs: a.duration_ms,
  }));

  return (
    <div
      className={`flex flex-col max-w-[65%] ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      } ${isConsecutive ? 'mt-0.5' : 'mt-2'} ${className}`}
    >
      <div
        className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed font-ui shadow-2xs max-w-full overflow-hidden relative pb-6 ${
          isOutgoing
            ? 'bg-primary/15 text-text border border-primary/30 rounded-tr-sm'
            : 'bg-panel-strong/60 text-text border border-border/30 rounded-tl-sm'
        }`}
      >
        <MessageRenderer
          content={message.body}
          channel={channel}
          contentType={contentType}
          htmlContent={message.html_content}
          plainTextContent={null}
          attachments={attachments}
        />

        <div className="absolute bottom-1 right-3 flex items-center gap-1">
          <span className="text-xs font-mono text-text-muted">{timestamp}</span>
          {isOutgoing && <MessageStatusIcon status={message.status} onRetry={onRetry} />}
        </div>
      </div>
    </div>
  );
};
