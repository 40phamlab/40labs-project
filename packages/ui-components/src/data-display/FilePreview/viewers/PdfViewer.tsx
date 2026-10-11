import * as React from 'react';

export interface PdfViewerProps {
  url: string;
  fileName: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, fileName }) => {
  return (
    <div className="w-full h-full bg-surface-secondary/50 p-4 flex flex-col">
      <iframe
        src={url}
        className="w-full h-[75vh] border border-border rounded-card bg-white shadow-sm"
        title={fileName}
      />
    </div>
  );
};
