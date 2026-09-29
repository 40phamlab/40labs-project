import * as React from 'react';
import type { Notification, MessageContentType, MessageChannel, NotificationAttachment } from '@40labs/types';
import { PlainTextRenderer } from './PlainTextRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HtmlEmailRenderer } from './HtmlEmailRenderer';
import { AttachmentRenderer } from './AttachmentRenderer';

export interface MessageRendererProps {
  notification?: Notification;
  content?: string;
  contentType?: MessageContentType;
  channel?: MessageChannel;
  htmlContent?: string | null;
  plainTextContent?: string | null;
  attachments?: NotificationAttachment[];
  className?: string;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  notification,
  content,
  contentType,
  channel,
  htmlContent,
  plainTextContent,
  attachments,
  className = '',
}) => {
  const effectiveContent = content || notification?.body || notification?.subject || '';
  const effectiveType = contentType || notification?.content_type;
  const effectiveChannel = channel || notification?.channel || 'amob';
  const effectiveHtml = htmlContent !== undefined ? htmlContent : notification?.html_content;
  const effectivePlainText = plainTextContent !== undefined ? plainTextContent : notification?.plain_text_content;
  const effectiveAttachments = attachments || notification?.attachments;

  // Centralized Renderer Selection Logic
  const renderPrimaryContent = () => {
    // 1. HTML Email Renderer
    if (effectiveType === 'html' || effectiveChannel === 'email') {
      return (
        <HtmlEmailRenderer
          htmlContent={effectiveHtml}
          plainTextContent={effectivePlainText}
          fallbackText={effectiveContent}
        />
      );
    }

    // 2. Markdown Renderer (aMob or explicit markdown)
    if (effectiveType === 'markdown' || effectiveChannel === 'amob') {
      return <MarkdownRenderer content={effectiveContent} />;
    }

    // 3. Plain Text Renderer (SMS, WhatsApp, text)
    return <PlainTextRenderer content={effectiveContent} />;
  };

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {renderPrimaryContent()}
      <AttachmentRenderer attachments={effectiveAttachments} />
    </div>
  );
};
