import * as React from 'react';

export interface CategorySquareProps {
  label: string;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

export const CategorySquare: React.FC<CategorySquareProps> = ({
  label,
  count,
  isActive = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full h-20 flex flex-col items-center justify-center p-2 rounded-card border transition-all duration-150 cursor-pointer
        ${
          isActive
            ? 'bg-panel-strong border-primary/50 text-primary elevation-inset'
            : 'bg-panel border-border/40 text-text-muted hover:text-text hover:border-border/80 elevation-raised'
        }
        ${className}
      `}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs font-mono font-bold mt-1 opacity-80">
          {count}
        </span>
      )}
    </button>
  );
};
