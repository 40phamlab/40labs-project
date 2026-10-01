import * as React from 'react';
import { X, FileText, Mic, Image as ImageIcon } from 'lucide-react';
import type { MessageAttachment } from '@40labs/types';

export interface AttachmentTrayProps {
  attachments: MessageAttachment[];
  onRemove: (id: string) => void;
  className?: string;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({
  attachments,
  onRemove,
  className = '',
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 p-2.5 bg-panel rounded-card border border-border/40 shadow-2xs ${className}`}>
      {attachments.map((att) => {
        const isImage = att.kind === 'image';
        const isAudio = att.kind === 'audio';
        return (
          <div
            key={att.id}
            className="flex items-center gap-2 bg-panel-strong border border-border/30 px-3 py-1.5 rounded-full text-xs text-text shadow-2xs group"
          >
            {isImage ? (
              <ImageIcon size={14} className="text-accent" />
            ) : isAudio ? (
              <Mic size={14} className="text-warning" />
            ) : (
              <FileText size={14} className="text-primary" />
            )}
            <span className="max-w-[140px] truncate font-medium">{att.file_name}</span>
            <span className="text-[10px] text-text-muted font-mono">
              ({Math.round((att.size_bytes || 0) / 1024)} KB)
            </span>
            <button
              type="button"
              onClick={() => onRemove(att.id)}
              className="text-text-muted hover:text-danger transition-colors ml-1"
              title="Remove attachment"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
