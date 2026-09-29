import * as React from 'react';
import type { NotificationAttachment } from '@40labs/types';
import { ImageMessage } from './ImageMessage';
import { AudioMessage } from './AudioMessage';
import { FileMessage } from './FileMessage';

export interface AttachmentRendererProps {
  attachments?: NotificationAttachment[];
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
        if (att.type === 'image') {
          return <ImageMessage key={att.id} name={att.name} size={att.size} url={att.url} />;
        }
        if (att.type === 'audio') {
          return <AudioMessage key={att.id} name={att.name} size={att.size} />;
        }
        if (att.type === 'file' || att.type === 'video' || att.type === 'link') {
          return <FileMessage key={att.id} name={att.name} size={att.size} url={att.url} />;
        }
        return (
          <FileMessage key={att.id} name={att.name} size={att.size} url={att.url} />
        );
      })}
    </div>
  );
};
