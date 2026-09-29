import * as React from 'react';
import { sanitizeHtml } from './sanitize';
import { PlainTextRenderer } from './PlainTextRenderer';
import { Mail } from 'lucide-react';

export interface HtmlEmailRendererProps {
  htmlContent?: string | null;
  plainTextContent?: string | null;
  fallbackText?: string;
  className?: string;
}

export const HtmlEmailRenderer: React.FC<HtmlEmailRendererProps> = ({
  htmlContent,
  plainTextContent,
  fallbackText,
  className = '',
}) => {
  const sanitized = React.useMemo(() => {
    if (!htmlContent) return '';
    return sanitizeHtml(htmlContent);
  }, [htmlContent]);

  const effectiveFallback = plainTextContent || fallbackText || '';

  if (!sanitized && effectiveFallback) {
    return <PlainTextRenderer content={effectiveFallback} className={className} />;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Email Badge Header Indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono pb-1 border-b border-border/20">
        <Mail size={11} className="text-info" />
        <span>Rendered Email (Sanitized HTML)</span>
      </div>

      {sanitized ? (
        <div
          className="email-content-container text-xs text-text font-ui leading-relaxed overflow-x-auto max-w-full"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      ) : (
        <PlainTextRenderer content={effectiveFallback} />
      )}
    </div>
  );
};
