import * as React from 'react';

export type TimelineStatus = 'completed' | 'pending' | 'future' | 'warning' | 'error';

export interface TimelineItem {
  id: string | number;
  timestamp: string;
  title: string;
  description?: string;
  status: TimelineStatus;
  actor?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline = ({ items, className = '' }: TimelineProps) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCompleted = item.status === 'completed';
        const isPending = item.status === 'pending';
        const isError = item.status === 'error';
        const isWarning = item.status === 'warning';

        // Node Styling
        const nodeBase = "relative z-10 w-4 h-4 rounded-full border-2 transition-all duration-200";
        const nodeStyles = {
          completed: "bg-primary border-primary shadow-surface-pop",
          pending: "bg-accent border-accent shadow-surface-pop",
          future: "bg-panel border-border shadow-inner-soft",
          warning: "bg-accent border-accent shadow-surface-pop animate-pulse",
          error: "bg-danger border-danger shadow-surface-pop",
        };

        return (
          <div key={item.id} className="flex gap-4 group">
            {/* Left Track */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`${nodeBase} ${nodeStyles[item.status]}`} />
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 ${isCompleted ? 'bg-primary/40' : 'bg-border/30 border-l border-dashed border-border'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 min-w-0 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-bold text-text truncate">{item.title}</span>
                <span className="font-mono text-tiny text-text-muted shrink-0 uppercase tracking-tighter">
                  {item.timestamp}
                </span>
              </div>

              {item.description && (
                <p className="text-xs text-text-muted leading-relaxed mb-1 max-w-md">
                  {item.description}
                </p>
              )}

              {item.actor && (
                <div className="flex items-center gap-1.5">
                  <span className="text-tiny font-bold uppercase tracking-wider text-accent/80">By:</span>
                  <span className="text-tiny font-mono text-text">{item.actor}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
