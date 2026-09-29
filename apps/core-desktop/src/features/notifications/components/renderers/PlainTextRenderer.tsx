import * as React from 'react';

export interface PlainTextRendererProps {
  content: string;
  className?: string;
}

export const PlainTextRenderer: React.FC<PlainTextRendererProps> = ({ content, className = '' }) => {
  // Convert URLs in plain text into clickable links safely
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary-hover break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-xs text-text font-ui ${className}`}>
      {renderTextWithLinks(content)}
    </div>
  );
};
