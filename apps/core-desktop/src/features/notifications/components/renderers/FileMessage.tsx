import * as React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface FileMessageProps {
  name: string;
  size?: string;
  url?: string;
  className?: string;
}

export const FileMessage: React.FC<FileMessageProps> = ({
  name,
  size = '450 KB',
  url,
  className = '',
}) => {
  const handleOpen = () => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`Opening document: ${name}`);
    }
  };

  return (
    <div
      onClick={handleOpen}
      className={`group flex items-center justify-between gap-3 p-3 bg-panel-strong/40 border border-border/30 rounded-card hover:bg-panel-strong/70 transition-colors cursor-pointer max-w-sm shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
            {name}
          </span>
          <span className="text-[10px] text-text-muted font-mono">{size} • Document</span>
        </div>
      </div>

      <IconButton
        icon={<ExternalLink size={14} className="text-text-muted group-hover:text-primary transition-colors" />}
        label="Download or open file"
        intent="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        className="shrink-0"
      />
    </div>
  );
};
