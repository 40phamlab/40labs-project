import * as React from 'react';
import { Download, Save, ExternalLink } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import { IconButton } from '../../primitives/IconButton';

export interface FallbackCardProps {
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  onDownload?: () => void;
  onSaveAs?: () => void;
  onOpenExternal?: () => void;
}

export const FallbackCard: React.FC<FallbackCardProps> = ({
  fileName,
  mimeType,
  sizeBytes,
  onDownload,
  onSaveAs,
  onOpenExternal,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-surface-secondary/50 p-8 gap-6 overflow-auto">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-surface-elevated border border-border shadow-sm">
        <FileTypeIcon fileName={fileName} mimeType={mimeType} size={48} />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-bold text-text-primary font-ui truncate">{fileName}</h3>
        {sizeBytes && (
          <p className="text-xs font-mono text-text-muted mt-1">
            {(sizeBytes / 1024).toFixed(1)} KB
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onDownload && (
          <IconButton icon={<Download size={16} />} label="Download" intent="secondary" onClick={onDownload} />
        )}
        {onSaveAs && (
          <IconButton icon={<Save size={16} />} label="Save As" intent="secondary" onClick={onSaveAs} />
        )}
        {onOpenExternal && (
          <IconButton icon={<ExternalLink size={16} />} label="Open Externally" intent="secondary" onClick={onOpenExternal} />
        )}
      </div>
    </div>
  );
};
