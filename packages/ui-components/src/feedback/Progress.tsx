import * as React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  intent?: 'primary' | 'accent' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export const Progress = ({
  value,
  max = 100,
  size = 'md',
  intent = 'primary',
  showLabel,
  className = '',
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  const intentClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    danger: 'bg-danger',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Progress</span>
          <span className="text-[10px] font-mono font-bold text-text">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-panel-strong rounded-full overflow-hidden elevation-inset ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${intentClasses[intent]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
