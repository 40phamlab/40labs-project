import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';
import { Badge } from '../../../primitives/Badge';

export interface TextViewerProps {
  url: string;
}

const MAX_TEXT_SIZE = 1024 * 1024; // 1MB

export const TextViewer: React.FC<TextViewerProps> = ({ url }) => {
  const [content, setContent] = React.useState<string>('');
  const [truncated, setTruncated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadText() {
      try {
        setLoading(true);
        const res = await fetch(url);
        const text = await res.text();
        if (isMounted) {
          if (text.length > MAX_TEXT_SIZE) {
            setContent(text.slice(0, MAX_TEXT_SIZE));
            setTruncated(true);
          } else {
            setContent(text);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load text content.');
          setLoading(false);
        }
      }
    }
    loadText();
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
    <div className="w-full h-full flex flex-col gap-3 p-4 bg-surface-elevated overflow-hidden">
      {truncated && (
        <div className="flex items-center justify-end shrink-0">
          <Badge variant="warning" size="sm">Truncated</Badge>
        </div>
      )}
      <pre className="flex-1 min-h-0 font-mono text-xs text-text-primary whitespace-pre-wrap break-all bg-surface-secondary/30 p-4 rounded-input overflow-auto border border-border/50">
        {content}
      </pre>
    </div>
  );
};
