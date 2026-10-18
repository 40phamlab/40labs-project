import * as React from 'react';
import { Download, Save, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import { resolveFileKind, isPreviewable, FileKind } from './fileKind';
import { IconButton } from '../../primitives/IconButton';
import { Tooltip } from '../../overlays/Tooltip';
import { ImageViewer } from './viewers/ImageViewer';
import { VideoViewer } from './viewers/VideoViewer';
import { AudioViewer } from './viewers/AudioViewer';
import { PdfViewer } from './viewers/PdfViewer';
import { DocxViewer } from './viewers/DocxViewer';
import { SheetViewer } from './viewers/SheetViewer';
import { TextViewer } from './viewers/TextViewer';
import { MarkdownViewer } from './viewers/MarkdownViewer';
import { CoreBackupViewer } from './viewers/CoreBackupViewer';
import { FallbackCard } from './FallbackCard';

export interface PreviewFileItem {
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  url: string;
}

export interface FilePreviewProps {
  file?: PreviewFileItem;
  files?: PreviewFileItem[];
  index?: number;
  onIndexChange?: (index: number) => void;
  onClose?: () => void;
  onDownload?: () => void;
  onSaveAs?: () => void;
  onOpenExternal?: () => void;
  variant?: 'inline' | 'modal';
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file: fileProp,
  files,
  index = 0,
  onIndexChange,
  onClose,
  onDownload,
  onSaveAs,
  onOpenExternal,
  variant: _variant = 'inline',
  className = '',
}) => {
  const currentList = files && files.length > 0 ? files : fileProp ? [fileProp] : [];
  const [currentIndex, setCurrentIndex] = React.useState(index);

  React.useEffect(() => {
    setCurrentIndex(index);
  }, [index]);

  const activeFile = currentList[currentIndex] || fileProp;

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      onIndexChange?.(nextIdx);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onIndexChange?.(nextIdx);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentList.length, onClose]);

  if (!activeFile) {
    return null;
  }

  const kind: FileKind = resolveFileKind(activeFile.fileName, activeFile.mimeType);
  const previewable = isPreviewable(kind);

  let viewerContent: React.ReactNode = null;
  if (!previewable) {
    viewerContent = (
      <FallbackCard
        fileName={activeFile.fileName}
        mimeType={activeFile.mimeType}
        sizeBytes={activeFile.sizeBytes}
        onDownload={onDownload}
        onSaveAs={onSaveAs}
        onOpenExternal={onOpenExternal}
      />
    );
  } else {
    switch (kind) {
      case 'image':
        viewerContent = <ImageViewer url={activeFile.url} fileName={activeFile.fileName} />;
        break;
      case 'video':
        viewerContent = <VideoViewer url={activeFile.url} fileName={activeFile.fileName} />;
        break;
      case 'audio':
        viewerContent = (
          <AudioViewer
            url={activeFile.url}
            fileName={activeFile.fileName}
            mimeType={activeFile.mimeType}
            sizeBytes={activeFile.sizeBytes}
          />
        );
        break;
      case 'pdf':
        viewerContent = <PdfViewer url={activeFile.url} fileName={activeFile.fileName} />;
        break;
      case 'docx':
        viewerContent = <DocxViewer url={activeFile.url} />;
        break;
      case 'sheet':
        viewerContent = <SheetViewer url={activeFile.url} fileName={activeFile.fileName} sizeBytes={activeFile.sizeBytes} />;
        break;
      case 'csv':
        viewerContent = <SheetViewer url={activeFile.url} isCsv fileName={activeFile.fileName} sizeBytes={activeFile.sizeBytes} />;
        break;
      case 'core':
        viewerContent = <CoreBackupViewer url={activeFile.url} fileName={activeFile.fileName} sizeBytes={activeFile.sizeBytes} />;
        break;
      case 'text':
      case 'markdown':
      case 'code':
        if (activeFile.fileName.toLowerCase().endsWith('.json')) {
          viewerContent = <SheetViewer url={activeFile.url} isJson fileName={activeFile.fileName} sizeBytes={activeFile.sizeBytes} />;
        } else {
          viewerContent = kind === 'markdown' ? <MarkdownViewer url={activeFile.url} /> : <TextViewer url={activeFile.url} />;
        }
        break;
      default:
        viewerContent = (
          <FallbackCard
            fileName={activeFile.fileName}
            mimeType={activeFile.mimeType}
            sizeBytes={activeFile.sizeBytes}
            onDownload={onDownload}
            onSaveAs={onSaveAs}
            onOpenExternal={onOpenExternal}
          />
        );
    }
  }

  return (
    <div
      className={`flex flex-col w-full h-full bg-surface-elevated rounded-[12px] border border-border shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileTypeIcon fileName={activeFile.fileName} mimeType={activeFile.mimeType} size={24} />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary font-ui truncate">
              {activeFile.fileName}
            </span>
            {activeFile.sizeBytes !== undefined && (
              <span className="text-[11px] font-mono text-text-muted">
                {(activeFile.sizeBytes / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentList.length > 1 && (
            <div className="flex items-center gap-1 mr-2 bg-surface-secondary/50 p-1 rounded-input border border-border">
              <IconButton
                icon={<ChevronLeft size={16} />}
                label="Previous"
                intent="ghost"
                size="sm"
                disabled={currentIndex === 0}
                onClick={handlePrev}
              />
              <span className="text-xs font-mono text-text-secondary px-2">
                {currentIndex + 1} / {currentList.length}
              </span>
              <IconButton
                icon={<ChevronRight size={16} />}
                label="Next"
                intent="ghost"
                size="sm"
                disabled={currentIndex === currentList.length - 1}
                onClick={handleNext}
              />
            </div>
          )}

          {onDownload && (
            <Tooltip content="Download">
              <IconButton
                icon={<Download size={16} />}
                label="Download"
                intent="secondary"
                size="sm"
                onClick={onDownload}
              />
            </Tooltip>
          )}

          {onSaveAs && (
            <Tooltip content="Save As">
              <IconButton
                icon={<Save size={16} />}
                label="Save As"
                intent="secondary"
                size="sm"
                onClick={onSaveAs}
              />
            </Tooltip>
          )}

          {onOpenExternal && (
            <Tooltip content="Open Externally">
              <IconButton
                icon={<ExternalLink size={16} />}
                label="Open Externally"
                intent="secondary"
                size="sm"
                onClick={onOpenExternal}
              />
            </Tooltip>
          )}

          {onClose && (
            <Tooltip content="Close">
              <IconButton
                icon={<X size={16} />}
                label="Close"
                intent="ghost"
                size="sm"
                onClick={onClose}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden bg-surface-secondary/20 flex flex-col">{viewerContent}</div>
    </div>
  );
};
