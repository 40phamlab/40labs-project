import * as React from 'react';
import { FileTypeIcon } from '../FileTypeIcon';

export interface AudioViewerProps {
  url: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ url, fileName, mimeType, sizeBytes }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-surface-secondary/50 p-8 gap-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-surface-elevated border border-border shadow-sm">
        <FileTypeIcon fileName={fileName} mimeType={mimeType} size={40} />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-base font-bold text-text-primary font-ui truncate">{fileName}</h3>
        {sizeBytes && (
          <p className="text-xs font-mono text-text-muted mt-1">
            {(sizeBytes / 1024).toFixed(1)} KB
          </p>
        )}
      </div>
      <div className="w-full max-w-md bg-surface-elevated border border-border p-4 rounded-card shadow-sm">
        <audio controls src={url} className="w-full" />
      </div>
    </div>
  );
};
