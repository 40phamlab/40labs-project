import * as React from 'react';

export interface VideoViewerProps {
  url: string;
  fileName: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ url, fileName }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface-secondary/50 p-4 overflow-hidden">
      <video
        controls
        src={url}
        className="max-h-full max-w-full object-contain rounded-card shadow-md bg-black"
        title={fileName}
      />
    </div>
  );
};
