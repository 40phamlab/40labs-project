import * as React from 'react';

export interface VideoViewerProps {
  url: string;
  fileName: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ url, fileName }) => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-surface-secondary/50 p-4">
      <video
        controls
        src={url}
        className="max-h-[75vh] max-w-[85vw] rounded-card shadow-md bg-black"
        title={fileName}
      />
    </div>
  );
};
