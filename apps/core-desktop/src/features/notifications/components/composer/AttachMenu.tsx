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
  const mimeForName = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const known: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf', txt: 'text/plain' };
    return ext ? known[ext] || 'application/octet-stream' : 'application/octet-stream';
  };

  const handleFileSelect = async (kind: 'image' | 'file') => {
    try {
      if (isTauriAvailable()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: kind === 'image'
            ? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
            : [{ name: 'Documents', extensions: ['pdf', 'txt'] }]
        });

        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          const failed: string[] = [];
          const successful: string[] = [];
          for (const filePath of paths) {
            const fileName = filePath.split(/[\\/]/).pop() || 'file';
            const mimeType = mimeForName(fileName);
            try {
              const saved = await notificationsApi.saveAttachment({ messageId, kind, fileName, mimeType, sourcePath: filePath });
              onAttachSaved(saved);
              successful.push(fileName);
            } catch (err) {
              console.error('Save attachment error:', err);
              failed.push(fileName);
            }
          }
          if (failed.length) {
            const proceed = window.confirm(`Failed: ${failed.join(', ')}. Uploaded subset: ${successful.join(', ') || '(none)'}. OK keeps this subset for the message. Cancel returns without sending; choose failed files again to retry or continue without them.`);
            if (!proceed) return;
          }
        }
      } else {
        fileInputRef.current?.click();
        return;
      }
    } catch (err) {
      console.error('Attach error:', err);
      toast.error('One or more files failed validation or upload.');
    }
    onClose();
  };

  const handleBrowserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let failed: string[] = [];
    let successful: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxBytes = file.type.startsWith('image/') || file.type.startsWith('audio/') ? 16 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxBytes) {
        failed.push(file.name);
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
          mimeType: file.type || mimeForName(file.name),
          bytes,
        });
        onAttachSaved(saved);
        successful.push(file.name);
      } catch (err) {
        console.error('Save attachment error:', err);
        failed.push(file.name);
      }
    }
    if (failed.length) {
      const proceed = window.confirm(`Failed: ${failed.join(', ')}. Uploaded subset: ${successful.join(', ') || '(none)'}. OK keeps this subset for the message. Cancel returns without sending; choose failed files again to retry or continue without them.`);
      if (!proceed) return;
    }
    e.target.value = '';
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
