import * as React from 'react';
import type { NotificationMessage, MessageChannel } from '@40labs/types';
import { MessageStatusIcon } from './MessageStatusIcon';
import { MessageRenderer } from './renderers/MessageRenderer';

export interface MessageBubbleProps {
  message: NotificationMessage;
  senderName?: string;
  channel?: MessageChannel | string;
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
  onRetry: _onRetry,
  className = '',
}) => {
  const isOutgoing = message.direction === 'outgoing';
  const timestamp = formatTime(message.sent_at || message.created_at);

  const attachments = message.attachments?.map((a: any) => ({
    id: a.id,
    type: a.kind as any,
    name: a.file_name,
    size: `${Math.round(a.size_bytes / 1024)} KB`,
    url: a.url,
    mime_type: a.mime_type,
    mimeType: a.mime_type,
    durationMs: a.duration_ms,
  }));

  return (
    <div
      className={`flex w-full min-w-0 flex-col ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      } ${isConsecutive ? 'mt-1' : 'mt-3'} ${className}`}
    >
      <div
        className={`w-fit min-w-0 max-w-[min(88%,48rem)] overflow-hidden rounded-2xl border px-4 pb-2.5 pt-3 font-ui text-[14px] leading-relaxed text-text shadow-[0_3px_7px_rgba(29,24,18,0.16)] ${
          isOutgoing
            ? 'rounded-tr-sm border-primary/45 bg-gradient-to-br from-primary/25 via-primary/15 to-panel'
            : 'rounded-tl-sm border-border/70 bg-gradient-to-br from-panel-strong via-panel to-panel-strong'
        }`}
      >
        {!isConsecutive && (
          <div className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${isOutgoing ? 'text-primary' : 'text-text-muted'}`}>
            {isOutgoing ? 'You' : senderName || 'Contact'}
          </div>
        )}
        <MessageRenderer
          content={message.body}
          channel={channel as any}
          contentType={contentType as any}
          htmlContent={message.html_content}
          plainTextContent={null}
          attachments={attachments}
          className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] [&_*]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-all"
        />

        <div className={`mt-2 flex min-w-20 items-center justify-end gap-1.5 pt-1.5 text-[10px] tabular-nums ${isOutgoing ? 'text-primary' : 'text-text-muted'}`}>
          <span className="whitespace-nowrap">{timestamp}</span>
          {isOutgoing && <MessageStatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
};
