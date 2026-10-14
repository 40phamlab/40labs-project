import * as React from 'react';
import { useFilePreview } from '../hooks/useFilePreview';
import { FilePreview } from '@40labs/ui-components';

const FilePreviewContext = React.createContext<ReturnType<typeof useFilePreview> | null>(null);

export const FilePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const preview = useFilePreview();
  const { previewState, closeModal, selectFileTab } = preview;

  return (
    <FilePreviewContext.Provider value={preview}>
      {children}
      {previewState.isOpen && previewState.files.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl h-[85vh] flex flex-col">
            <FilePreview
              files={previewState.files}
              index={previewState.currentIndex}
              onIndexChange={selectFileTab}
              onClose={closeModal}
              variant="modal"
            />
          </div>
        </div>
      )}
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
