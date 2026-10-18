import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';

export interface DocxViewerProps {
  url: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ url }) => {
  const [html, setHtml] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadDocx() {
      try {
        setLoading(true);
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (isMounted) {
          setHtml(result.value);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to parse Word document.');
          setLoading(false);
        }
      }
    }
    loadDocx();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] gap-3">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert intent="danger" title="Error">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-8 bg-surface-elevated overflow-hidden">
      <div
        className="flex-1 min-h-0 overflow-auto prose max-w-none text-text-primary"
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
    </div>
  );
};
