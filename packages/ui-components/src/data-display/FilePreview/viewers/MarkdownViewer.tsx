import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';

export interface MarkdownViewerProps {
  url: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ url }) => {
  const [content, setContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadMarkdown() {
      try {
        setLoading(true);
        const res = await fetch(url);
        const text = await res.text();
        if (isMounted) {
          setContent(text);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load markdown content.');
          setLoading(false);
        }
      }
    }
    loadMarkdown();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px]">
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
    <div className="w-full h-full flex flex-col p-6 bg-surface-elevated overflow-hidden font-ui text-text-primary">
      <div className="flex-1 min-h-0 overflow-auto prose prose-sm max-w-none whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </div>
    </div>
  );
};
