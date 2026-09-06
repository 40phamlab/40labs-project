import React from 'react';

export interface CategorySquareProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * CategorySquare
 * A 1:1 aspect ratio square for pharmacy category selection.
 * Uses claymorphic design tokens for active/inactive states.
 */
export const CategorySquare: React.FC<CategorySquareProps> = ({
  label,
  isActive = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        aspect-square w-16 h-16 flex items-center justify-center p-2
        rounded-card transition-all duration-200
        ${
          isActive
            ? 'bg-panel-strong elevation-inset text-primary'
            : 'bg-panel shadow-surface-pop text-text-muted hover:text-text'
        }
        ${className}
      `}
    >
      <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-tight">
        {label}
      </span>
    </button>
  );
};
