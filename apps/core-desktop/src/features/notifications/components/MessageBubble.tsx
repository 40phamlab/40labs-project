import * as React from 'react';
import type { NotificationMessage } from '@40labs/types';
import { MessageRenderer } from './renderers/MessageRenderer';
import { MessageStatusIcon } from './MessageStatusIcon';

export interface MessageBubbleProps {
  message: NotificationMessage;
  previousMessage?: NotificationMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, previousMessage }) => {
  const isOutgoing = message.direction === 'outgoing';
  const isSameDirection = previousMessage && previousMessage.direction === message.direction;
  const marginClass = isSameDirection ? 'my-0.5' : 'my-2';

  // Bubble rounding / tail omitted on grouped messages
  const roundingClass = isOutgoing
    ? isSameDirection
      ? 'rounded-2xl rounded-br-md'
      : 'rounded-2xl rounded-br-none'
    : isSameDirection
      ? 'rounded-2xl rounded-bl-md'
      : 'rounded-2xl rounded-bl-none';

  return (
    <div className={`flex w-full ${marginClass} ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[65%] ${roundingClass} px-4 py-2.5 shadow-xs text-xs space-y-1.5 ${
          isOutgoing
            ? 'bg-primary text-white'
            : 'bg-panel-strong text-text-primary border border-border/40'
        }`}
      >
        <MessageRenderer
          content={message.body}
          contentType={message.content_type as any}
          htmlContent={message.html_content}
          attachments={message.attachments as any}
        />

        <div className={`text-[9px] flex items-center justify-end gap-1 font-mono ${isOutgoing ? 'text-white/80' : 'text-text-muted'}`}>
          <span>{new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOutgoing && <MessageStatusIcon status={message.status} className={isOutgoing ? 'text-white/80' : ''} />}
        </div>
      </div>
    </div>
  );
};
