import React from 'react';
import { Button } from '../primitives/Button';

export interface CompactProductRowProps {
  product: {
    id: string;
    name: string;
    priceFormatted: string;
    scientificName?: string;
  };
  onAdd: (id: string) => void;
  onMoreInfo: (id: string) => void;
  className?: string;
}

/**
 * CompactProductRow
 * A specialized data row for products, following the pharmacy design reference.
 */
export const CompactProductRow: React.FC<CompactProductRowProps> = ({
  product,
  onAdd,
  onMoreInfo,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col gap-1 p-3 bg-panel-strong/10 rounded-input
        hover:bg-panel-strong/20 hover:elevation-inset transition-all
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left Side: Product Info */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-text truncate">
            {product.name}
          </span>
          <span className="text-xs text-accent font-mono font-bold">
            {product.priceFormatted}
          </span>
          {product.scientificName && (
            <span className="text-[10px] text-text-muted italic truncate mt-0.5">
              {product.scientificName}
            </span>
          )}
        </div>

        {/* Right Side: Action */}
        <Button
          size="sm"
          intent="accent"
          onClick={() => onAdd(product.id)}
          className="rounded-full !px-4 !h-6 !text-[9px] uppercase font-bold shrink-0 ml-4"
        >
          Add
        </Button>
      </div>

      {/* Footer: Detailed Link */}
      <button
        onClick={() => onMoreInfo(product.id)}
        className="self-end text-[9px] text-text-muted hover:text-primary transition-colors italic decoration-dotted underline"
      >
        More about {product.name}
      </button>
    </div>
  );
};
