import React from 'react';

export interface GenericHistoryRowProps {
  id: string;
  content: React.ReactNode;
  className?: string;
}

/**
 * GenericHistoryRow
 * A standardized row for history lists, mimicking the design's soft surface blocks.
 */
export const GenericHistoryRow: React.FC<GenericHistoryRowProps> = ({
  id,
  content,
  className = '',
}) => {
  return (
    <div
      className={`
        w-full min-h-[64px] p-4 bg-panel rounded-card elevation-flat
        hover:elevation-raised transition-all cursor-pointer flex items-center
        border border-border/5
        ${className}
      `}
    >
      <div className="flex-1 text-sm text-text">
        {content}
      </div>
    </div>
  );
};
