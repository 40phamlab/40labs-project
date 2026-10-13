import * as React from 'react';
import { X, FileText, Mic, Image as ImageIcon } from 'lucide-react';
import type { MessageAttachment } from '@40labs/types';
import { resolveAttachmentPreviewUrl } from '../../../../api/notificationsApi';

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
      {attachments.map((att) => <AttachmentTrayItem key={att.id} attachment={att} onRemove={onRemove} />)}
    </div>
  );
};

const AttachmentTrayItem: React.FC<{ attachment: MessageAttachment; onRemove: (id: string) => void }> = ({ attachment: att, onRemove }) => {
  const isImage = att.kind === 'image';
  const isAudio = att.kind === 'audio';
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [isExpanded, setIsExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!isImage && !isAudio) return;
    let active = true;
    resolveAttachmentPreviewUrl(att.id).then((url) => { if (active) setPreviewUrl(url); }).catch(() => {});
    return () => { active = false; };
  }, [att.id, isAudio, isImage]);

  return (
          <div
            className="relative flex items-center gap-2 bg-panel-strong border border-border/30 p-1.5 rounded-card text-xs text-text shadow-2xs group"
          >
            {isImage && previewUrl ? (
              <button type="button" onClick={() => setIsExpanded(true)} aria-label={`Preview ${att.file_name}`}>
                <img src={previewUrl} alt={`Preview of ${att.file_name}`} className="w-14 h-12 rounded object-cover border border-border/40" />
              </button>
            ) : isImage ? (
              <ImageIcon size={14} className="text-accent" />
            ) : isAudio ? (
              <Mic size={14} className="text-warning" />
            ) : (
              <FileText size={14} className="text-primary" />
            )}
            <div className="flex min-w-0 flex-col px-1">
            <span className="max-w-[140px] truncate font-medium">{att.file_name}</span>
            <span className="text-[10px] text-text-muted font-mono">
              ({Math.round((att.size_bytes || 0) / 1024)} KB)
            </span>
            {isAudio && previewUrl && <audio controls preload="metadata" src={previewUrl} aria-label={`Preview ${att.file_name}`} className="mt-1 h-8 w-48" />}
            </div>
            <button
              type="button"
              onClick={() => onRemove(att.id)}
              className="text-text-muted hover:text-danger transition-colors ml-1"
              title="Remove attachment"
            >
              <X size={13} />
            </button>
            {isExpanded && previewUrl && (
              <div role="dialog" aria-modal="true" aria-label={`Preview ${att.file_name}`} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6" onClick={() => setIsExpanded(false)}>
                <img src={previewUrl} alt={att.file_name} className="max-h-[90vh] max-w-[90vw] rounded object-contain" />
              </div>
            )}
          </div>
  );
};
