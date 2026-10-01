import * as React from 'react';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';
import { isTauriAvailable } from '../../../../api/client';
import { notificationsApi } from '../../../../api/notificationsApi';
import { useToast } from '../../../../hooks/useToast';

export interface FileMessageProps {
  attachmentId?: string;
  name: string;
  size?: string;
  url?: string;
  className?: string;
}

export const FileMessage: React.FC<FileMessageProps> = ({
  attachmentId,
  name,
  size = '450 KB',
  url: _url,
  className = '',
}) => {
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved' | 'failed'>('idle');

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isTauriAvailable()) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const destPath = await save({ defaultPath: name });
        if (destPath && attachmentId) {
          await notificationsApi.exportAttachment(attachmentId, destPath);
          setSaveStatus('saved');
          toast.success(`Saved file to ${destPath}`);
        }
      } else {
        if (attachmentId) {
          await notificationsApi.exportAttachment(attachmentId);
        }
        setSaveStatus('saved');
        toast.success(`Exported file: ${name}`);
      }
    } catch (err) {
      console.error('Save file error:', err);
      setSaveStatus('failed');
      toast.error('Failed to save file.');
    }
  };

  return (
    <div
      onClick={handleSave}
      className={`group flex items-center justify-between gap-3 p-3 bg-panel-strong/40 border border-border/30 rounded-card hover:bg-panel-strong/75 transition-colors cursor-pointer max-w-sm shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
            {name}
          </span>
          <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
            {size} • Document
            {saveStatus === 'saved' && <CheckCircle size={11} className="text-success inline ml-1" />}
            {saveStatus === 'failed' && <AlertCircle size={11} className="text-danger inline ml-1" />}
          </span>
        </div>
      </div>

      <IconButton
        icon={
          saveStatus === 'saved' ? (
            <CheckCircle size={15} className="text-success" />
          ) : saveStatus === 'failed' ? (
            <AlertCircle size={15} className="text-danger" />
          ) : (
            <Download size={15} className="text-text-muted group-hover:text-primary transition-colors" />
          )
        }
        label="Save file"
        intent="ghost"
        size="sm"
        onClick={handleSave}
        className="shrink-0"
      />
    </div>
  );
};
