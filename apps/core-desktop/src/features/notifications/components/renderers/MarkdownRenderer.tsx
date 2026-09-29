import * as React from 'react';
import { parseMarkdown, formatInlineText } from './sanitize';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const tokens = React.useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={`flex flex-col gap-2 text-xs text-text font-ui leading-relaxed ${className}`}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'heading': {
            const level = token.level || 2;
            const sizeClass =
              level === 1
                ? 'text-sm font-bold mt-2 mb-1 text-text'
                : level === 3
                ? 'text-xs font-bold mt-1 text-text'
                : 'text-xs font-bold mt-1.5 mb-0.5 text-text';
            return React.createElement(
              `h${level}`,
              {
                key: idx,
                className: sizeClass,
                dangerouslySetInnerHTML: { __html: formatInlineText(token.content) },
              }
            );
          }
          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-primary/60 pl-3 py-1 my-1 text-text-muted italic bg-panel-strong/30 rounded-r"
                dangerouslySetInnerHTML={{ __html: formatInlineText(token.content) }}
              />
            );
          case 'list':
            return (
              <ul key={idx} className="list-disc list-inside pl-2 flex flex-col gap-1 my-1">
                {token.items?.map((item, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: formatInlineText(item) }}
                  />
                ))}
              </ul>
            );
          case 'paragraph':
          default:
            return (
              <p
                key={idx}
                dangerouslySetInnerHTML={{ __html: formatInlineText(token.content) }}
              />
            );
        }
      })}
    </div>
  );
};
