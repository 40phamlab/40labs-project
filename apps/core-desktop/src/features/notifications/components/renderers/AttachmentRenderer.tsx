import * as React from 'react';
import type { NotificationAttachment } from '@40labs/types';
import { ImageMessage } from './ImageMessage';
import { AudioMessage } from './AudioMessage';
import { FileMessage } from './FileMessage';

export interface AttachmentRendererProps {
  attachments?: Array<NotificationAttachment & { durationMs?: number }>;
  className?: string;
}

export const AttachmentRenderer: React.FC<AttachmentRendererProps> = ({
  attachments,
  className = '',
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 my-2 ${className}`}>
      {attachments.map((att) => {
        if (att.kind === 'image' || att.type === 'image') {
          return <ImageMessage key={att.id} name={att.file_name || att.name} size={att.size} url={att.url} />;
        }
        if (att.kind === 'audio' || att.type === 'audio') {
          return <AudioMessage key={att.id} name={att.file_name || att.name} size={att.size} url={att.url} durationMs={att.duration_ms || att.durationMs} />;
        }
        return <FileMessage key={att.id} attachmentId={att.id} name={att.file_name || att.name} size={att.size} url={att.url} />;
      })}
    </div>
  );
};
