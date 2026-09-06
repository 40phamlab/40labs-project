import React from 'react';
import { Button } from '../primitives/Button';

export interface ActionRequestCardProps {
  title: string;
  details: string[];
  actionLabel: string;
  onAction: () => void;
  className?: string;
}

/**
 * ActionRequestCard
 * A compact request card for pharmacy workflows.
 * Uses design tokens for the claymorphic surface-pop effect.
 */
export const ActionRequestCard: React.FC<ActionRequestCardProps> = ({
  title,
  details,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-panel rounded-card p-4 shadow-surface-pop border border-border/5
        flex items-center justify-between gap-4
        ${className}
      `}
    >
      {/* Left Side: Title and Details (Stack) */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <h4 className="text-sm font-bold text-text truncate">
          {title}
        </h4>
        <div className="flex flex-col">
          {details.map((detail, index) => (
            <span key={index} className="text-xs text-text-muted truncate">
              {detail}
            </span>
          ))}
        </div>
      </div>

      {/* Right Side: Action Button */}
      <div className="shrink-0 flex items-end h-full">
        <Button
          size="sm"
          intent="primary"
          onClick={onAction}
          className="rounded-full !px-5 !h-8 !text-[11px] font-bold uppercase tracking-wider"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
