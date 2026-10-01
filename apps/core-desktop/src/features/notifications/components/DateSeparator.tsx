import * as React from 'react';

export interface DateSeparatorProps {
  date: string;
  className?: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date, className = '' }) => {
  return (
    <div className={`flex items-center justify-center my-3 ${className}`}>
      <span className="px-3 py-1 bg-panel-strong/80 border border-border/30 rounded-full text-xs font-medium text-text-muted">
        {date}
      </span>
    </div>
  );
};
