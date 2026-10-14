import * as React from 'react';
import { X, FileText, Image, FileSpreadsheet, FileCode, Film } from 'lucide-react';
import { useFilePreviewContext } from '../providers/FilePreviewProvider';

export const OpenFileTabs: React.FC = () => {
  const { previewState, selectFileTab, closeFileTab } = useFilePreviewContext();
  const { files, currentIndex, isOpen } = previewState;

  if (!files || files.length === 0) {
    return null;
  }

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileText size={12} className="text-danger shrink-0" />;
    if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return <Image size={12} className="text-primary shrink-0" />;
    if (lower.match(/\.(csv|xlsx|xls)$/i)) return <FileSpreadsheet size={12} className="text-success shrink-0" />;
    if (lower.match(/\.(json|txt|md|js|ts)$/i)) return <FileCode size={12} className="text-accent shrink-0" />;
    if (lower.match(/\.(mp4|webm|mov)$/i)) return <Film size={12} className="text-action-primary shrink-0" />;
    return <FileText size={12} className="text-text-muted shrink-0" />;
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto max-w-[320px] sm:max-w-[450px] px-1 no-drag custom-scrollbar" data-tauri-drag-region="false">
      {files.map((file, idx) => {
        const isActive = isOpen && currentIndex === idx;
        return (
          <div
            key={file.url || `${file.fileName}-${idx}`}
            onClick={() => selectFileTab(idx)}
            className={[
              'group flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs cursor-pointer select-none transition-all no-drag border',
              isActive
                ? 'bg-panel text-text-primary border-border shadow-sm font-semibold'
                : 'bg-surface-secondary/40 text-text-muted hover:text-text-primary hover:bg-surface-hover border-border/40',
            ]
              .filter(Boolean)
              .join(' ')}
            title={file.fileName}
            data-tauri-drag-region="false"
          >
            {getFileIcon(file.fileName)}
            <span className="truncate max-w-[100px] sm:max-w-[140px]">{file.fileName}</span>
            <button
              type="button"
              onClick={(e) => closeFileTab(idx, e)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-surface-hover text-text-muted hover:text-text-primary ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
              aria-label={`Close ${file.fileName}`}
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
