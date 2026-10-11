import * as React from 'react';
import type { MessageAttachment } from '@40labs/types';
import { isUsingTauriIpc, invokeCommand } from '../api/client';
import { useToast } from './useToast';

export interface FilePreviewState {
  isOpen: boolean;
  file?: {
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    url: string;
  };
  attachmentId?: string;
  onDownload?: () => Promise<void>;
  onSaveAs?: () => Promise<void>;
  onOpenExternal?: () => Promise<void>;
  onClose?: () => void;
}

export function useFilePreview() {
  const { toast } = useToast();
  const [state, setState] = React.useState<FilePreviewState>({ isOpen: false });

  const openAttachment = async (att: MessageAttachment) => {
    try {
      let fileUrl = (att as any).url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let absPath = '';

      if (isUsingTauriIpc()) {
        absPath = await invokeCommand<string>('resolve_attachment_path', { attachmentId: att.id });
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        fileUrl = convertFileSrc(absPath);
      }

      const handleDownload = async () => {
        if (isUsingTauriIpc()) {
          const res = await invokeCommand<{ path: string; folder: string }>('export_attachment', {
            attachmentId: att.id,
            category: 'attachments',
          });
          toast.success(`Saved to ${res.path}`);
          try {
            const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
            await revealItemInDir(res.path);
          } catch (e) {
            console.error('Failed to reveal item in dir:', e);
          }
        } else {
          toast.success(`Downloaded ${att.file_name}`);
        }
      };

      const handleSaveAs = async () => {
        if (isUsingTauriIpc()) {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const destPath = await save({ defaultPath: att.file_name });
          if (destPath) {
            const savedPath = await invokeCommand<string>('export_attachment_to_path', {
              attachmentId: att.id,
              destPath,
            });
            toast.success(`Saved to ${savedPath}`);
            try {
              const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
              await revealItemInDir(savedPath);
            } catch (e) {
              console.error('Failed to reveal item in dir:', e);
            }
          }
        } else {
          toast.success(`Saved ${att.file_name}`);
        }
      };

      const handleOpenExternal = async () => {
        if (isUsingTauriIpc() && absPath) {
          const { openPath } = await import('@tauri-apps/plugin-opener');
          await openPath(absPath);
        } else {
          window.open(fileUrl, '_blank');
        }
      };

      setState({
        isOpen: true,
        file: {
          fileName: att.file_name,
          mimeType: att.mime_type,
          sizeBytes: att.size_bytes,
          url: fileUrl,
        },
        attachmentId: att.id,
        onDownload: handleDownload,
        onSaveAs: handleSaveAs,
        onOpenExternal: handleOpenExternal,
        onClose: () => setState({ isOpen: false }),
      });
    } catch (err) {
      console.error('Failed to open attachment preview:', err);
      toast.error('Failed to preview attachment.');
    }
  };

  const openBlob = (file: { fileName: string; mimeType?: string; blob: Blob }) => {
    const url = URL.createObjectURL(file.blob);
    setState({
      isOpen: true,
      file: {
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.blob.size,
        url,
      },
      onClose: () => {
        URL.revokeObjectURL(url);
        setState({ isOpen: false });
      },
    });
  };

  const closeModal = () => {
    if (state.file?.url.startsWith('blob:')) {
      URL.revokeObjectURL(state.file.url);
    }
    setState({ isOpen: false });
    state.onClose?.();
  };

  return {
    previewState: state,
    openAttachment,
    openBlob,
    closeModal,
  };
}
