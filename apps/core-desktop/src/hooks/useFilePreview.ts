import * as React from 'react';
import type { MessageAttachment } from '@40labs/types';
import { isUsingTauriIpc, invokeCommand } from '../api/client';
import { useToast } from './useToast';

export interface PreviewFileItem {
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  url: string;
}

export interface FilePreviewState {
  isOpen: boolean;
  files: PreviewFileItem[];
  currentIndex: number;
  file?: PreviewFileItem;
  onDownload?: () => Promise<void>;
  onSaveAs?: () => Promise<void>;
  onOpenExternal?: () => Promise<void>;
  onClose?: () => void;
}

export function useFilePreview() {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<PreviewFileItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const activeFile = files[currentIndex];

  const openFile = (item: PreviewFileItem) => {
    setFiles((prev) => {
      const existingIdx = prev.findIndex((f) => f.url === item.url || f.fileName === item.fileName);
      if (existingIdx >= 0) {
        setCurrentIndex(existingIdx);
        setIsOpen(true);
        return prev;
      }
      const next = [...prev, item];
      setCurrentIndex(next.length - 1);
      setIsOpen(true);
      return next;
    });
  };

  const closeFileTab = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFiles((prev) => {
      const itemToClose = prev[index];
      if (itemToClose && itemToClose.url && itemToClose.url.startsWith('blob:')) {
        URL.revokeObjectURL(itemToClose.url);
      }
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setIsOpen(false);
      } else if (currentIndex >= next.length) {
        setCurrentIndex(next.length - 1);
      }
      return next;
    });
  };

  const selectFileTab = (index: number) => {
    if (index >= 0 && index < files.length) {
      setCurrentIndex(index);
      setIsOpen(true);
    }
  };

  const openAttachment = async (att: MessageAttachment) => {
    try {
      const attWithUrl = att as MessageAttachment & { url?: string };
      let fileUrl = attWithUrl.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let absPath = '';

      if (isUsingTauriIpc()) {
        absPath = await invokeCommand<string>('resolve_attachment_path', { attachmentId: att.id });
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        fileUrl = convertFileSrc(absPath);
      }

      openFile({
        fileName: att.file_name,
        mimeType: att.mime_type,
        sizeBytes: att.size_bytes,
        url: fileUrl,
      });
    } catch {
      toast.error('Failed to preview attachment.');
    }
  };

  const openBlob = (file: { fileName: string; mimeType?: string; blob: Blob }) => {
    const url = URL.createObjectURL(file.blob);
    openFile({
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.blob.size,
      url,
    });
  };

  const handleDownload = async () => {
    if (!activeFile) return;
    try {
      if (isUsingTauriIpc()) {
        const { save: saveDialog } = await import('@tauri-apps/plugin-dialog');
        const dest = await saveDialog({ defaultPath: activeFile.fileName });
        if (dest) {
          const resp = await fetch(activeFile.url);
          const buffer = await resp.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buffer));
          await invokeCommand('export_attachment_to_path', {
            bytes,
            destPath: dest,
          });
          toast.success(`Exported ${activeFile.fileName}`);
        }
      } else {
        const a = document.createElement('a');
        a.href = activeFile.url;
        a.download = activeFile.fileName;
        a.click();
      }
    } catch (err) {
      console.warn('Download error:', err);
      toast.error('Failed to export file.');
    }
  };

  const handleOpenExternal = async () => {
    if (!activeFile) return;
    try {
      if (isUsingTauriIpc()) {
        const { openPath } = await import('@tauri-apps/plugin-opener');
        await openPath(activeFile.url);
      } else {
        window.open(activeFile.url, '_blank');
      }
    } catch (err) {
      console.warn('Open external error:', err);
      toast.error('Failed to open file externally.');
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const previewState: FilePreviewState = {
    isOpen,
    files,
    currentIndex,
    file: activeFile,
    onDownload: handleDownload,
    onSaveAs: handleDownload,
    onOpenExternal: handleOpenExternal,
    onClose: closeModal,
  };

  return {
    previewState,
    openFile,
    closeFileTab,
    selectFileTab,
    openAttachment,
    openBlob,
    closeModal,
  };
}
