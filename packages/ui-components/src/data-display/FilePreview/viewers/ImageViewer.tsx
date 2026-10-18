import * as React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { IconButton } from '../../../primitives/IconButton';

export interface ImageViewerProps {
  url: string;
  fileName: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ url, fileName }) => {
  const [scale, setScale] = React.useState(1);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const reset = () => setScale(1);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-surface-secondary/50 p-4">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-surface-elevated border border-border rounded-input p-1 shadow-md">
        <IconButton icon={<ZoomIn size={16} />} label="Zoom in" intent="ghost" size="sm" onClick={zoomIn} />
        <IconButton icon={<ZoomOut size={16} />} label="Zoom out" intent="ghost" size="sm" onClick={zoomOut} />
        <IconButton icon={<RotateCcw size={16} />} label="Reset zoom" intent="ghost" size="sm" onClick={reset} />
      </div>
      <div className="flex items-center justify-center h-full w-full overflow-auto p-2">
        <img
          src={url}
          alt={fileName}
          style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
          className="max-h-full max-w-full object-contain rounded-card shadow-sm select-none"
        />
      </div>
    </div>
  );
};
