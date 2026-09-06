import React from 'react';

export interface FeatureItem {
  text: string;
  highlightWord?: string;
}

export interface HighlightableFeatureListProps {
  features: FeatureItem[];
  className?: string;
}

/**
 * HighlightableFeatureList
 * A vertical list of features with optional word highlighting.
 * Renders items in a '- [text]' format.
 */
export const HighlightableFeatureList: React.FC<HighlightableFeatureListProps> = ({
  features,
  className = '',
}) => {
  const renderText = (item: FeatureItem) => {
    if (!item.highlightWord || !item.text.includes(item.highlightWord)) {
      return item.text;
    }

    const parts = item.text.split(new RegExp(`(${item.highlightWord})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === item.highlightWord?.toLowerCase() ? (
        <span key={i} className="text-accent font-bold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {features.map((feature, index) => (
        <div key={index} className="flex gap-2 text-sm text-text-muted">
          <span>-</span>
          <p>{renderText(feature)}</p>
        </div>
      ))}
    </div>
  );
};
