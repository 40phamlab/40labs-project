import * as React from 'react';

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
    return <div className="p-8 text-center text-xs text-text-muted">Loading Markdown...</div>;
  }

  if (error) {
    return <div className="p-6 text-xs text-danger">Error: {error}</div>;
  }

  return (
    <div className="w-full h-[75vh] overflow-auto bg-surface-elevated border border-border rounded-card p-6 shadow-sm flex flex-col gap-3 font-ui text-text">
      <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </div>
    </div>
  );
};
