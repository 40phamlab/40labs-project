import * as React from 'react';
import { useFilePreview } from '../hooks/useFilePreview';

const FilePreviewContext = React.createContext<ReturnType<typeof useFilePreview> | null>(null);

export const FilePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const preview = useFilePreview();

  return (
    <FilePreviewContext.Provider value={preview}>
      {children}
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
