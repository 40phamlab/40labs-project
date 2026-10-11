import * as React from 'react';
import { useFilePreview } from '../hooks/useFilePreview';
import { FilePreviewModal } from '@40labs/ui-components';

const FilePreviewContext = React.createContext<ReturnType<typeof useFilePreview> | null>(null);

export const FilePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const preview = useFilePreview();
  const { previewState, closeModal } = preview;

  return (
    <FilePreviewContext.Provider value={preview}>
      {children}
      <FilePreviewModal
        isOpen={previewState.isOpen}
        onClose={closeModal}
        file={previewState.file}
        onDownload={previewState.onDownload}
        onSaveAs={previewState.onSaveAs}
        onOpenExternal={previewState.onOpenExternal}
      />
    </FilePreviewContext.Provider>
  );
};

export function useFilePreviewContext(): ReturnType<typeof useFilePreview> {
  const context = React.useContext(FilePreviewContext);
  if (!context) {
    throw new Error('useFilePreviewContext must be used within a FilePreviewProvider');
  }
  return context;
}
