import * as React from 'react';
import { Image as ImageIcon, Download } from 'lucide-react';

export interface ImageMessageProps {
  url?: string;
  name?: string;
  size?: string;
  className?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  url,
  name = 'Shared Image',
  size,
  className = '',
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const imageUrl = url || '';

  if (!imageUrl || hasError) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-panel-strong/40 border border-border/30 rounded-card text-xs text-text-muted ${className}`}>
        <ImageIcon size={16} className="text-text-muted" />
        <span>Image unavailable: {name}</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative group overflow-hidden rounded-card border border-border/30 bg-panel-strong/20 max-w-sm cursor-pointer shadow-2xs ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        {isLoading && (
          <div className="w-full h-40 bg-panel-strong/50 animate-pulse flex items-center justify-center text-text-muted text-xs">
            Loading image...
          </div>
        )}
        <img
          src={imageUrl}
          alt={name}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          className={`w-full h-auto max-h-56 object-cover transition-transform duration-200 group-hover:scale-[1.02] ${isLoading ? 'hidden' : 'block'}`}
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white flex items-center justify-between text-[11px]">
          <span className="truncate max-w-[200px]">{name}</span>
          {size && <span className="opacity-80 font-mono text-[10px]">{size}</span>}
        </div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-card bg-panel p-3 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl} alt={name} className="max-w-full max-h-[80vh] object-contain rounded" />
            <div className="flex items-center justify-between px-2 text-xs text-text">
              <span className="font-bold">{name}</span>
              <a
                href={imageUrl}
                download={name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold transition-colors"
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
