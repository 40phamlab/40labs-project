import * as React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { isTauriAvailable } from '../../../../api/client';
import { notificationsApi } from '../../../../api/notificationsApi';
import { useToast } from '../../../../hooks/useToast';

export interface AttachMenuProps {
  messageId: string;
  onAttachSaved: (att: any) => void;
  onClose: () => void;
  className?: string;
}

export const AttachMenu: React.FC<AttachMenuProps> = ({
  messageId,
  onAttachSaved,
  onClose,
  className = '',
}) => {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (kind: 'image' | 'file') => {
    try {
      if (isTauriAvailable()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: kind === 'image'
            ? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
            : [{ name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'] }]
        });

        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          for (const filePath of paths) {
            const fileName = filePath.split(/[\\/]/).pop() || 'file';
            const mimeType = kind === 'image' ? 'image/png' : 'application/pdf';
            const saved = await notificationsApi.saveAttachment({
              messageId,
              kind,
              fileName,
              mimeType,
              sourcePath: filePath,
            });
            onAttachSaved(saved);
          }
        }
      } else {
        fileInputRef.current?.click();
        return;
      }
    } catch (err) {
      console.error('Attach error:', err);
      toast.error('Failed to attach file.');
    }
    onClose();
  };

  const handleBrowserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxBytes = file.type.startsWith('image/') || file.type.startsWith('audio/') ? 16 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`File "${file.name}" exceeds size limit.`);
        continue;
      }

      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

      try {
        const saved = await notificationsApi.saveAttachment({
          messageId,
          kind,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          bytes,
        });
        onAttachSaved(saved);
      } catch (err) {
        console.error('Save attachment error:', err);
        toast.error(`Failed to save attachment ${file.name}`);
      }
    }
    onClose();
  };

  return (
    <div className={`absolute bottom-full left-0 mb-2 w-48 bg-panel border border-border/40 rounded-card shadow-xl py-1.5 z-50 flex flex-col ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleBrowserFileChange}
      />
      <button
        type="button"
        onClick={() => handleFileSelect('file')}
        className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
      >
        <FileText size={16} className="text-primary" /> Document
      </button>
      <button
        type="button"
        onClick={() => handleFileSelect('image')}
        className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
      >
        <ImageIcon size={16} className="text-accent" /> Photos & Videos
      </button>
    </div>
  );
};
