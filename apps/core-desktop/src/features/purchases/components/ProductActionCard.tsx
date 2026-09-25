import * as React from 'react';
import { Button } from '@40labs/ui-components';

export interface ProductActionCardProps {
  productName: string;
  badgeUrl?: string;
  currentPrice: string;
  originalPrice?: string;
  onAddToCart: () => void;
  onCommunicate: () => void;
  onMoreInfo: () => void;
  className?: string;
}

export const ProductActionCard: React.FC<ProductActionCardProps> = ({
  productName,
  badgeUrl,
  currentPrice,
  originalPrice,
  onAddToCart,
  onCommunicate,
  onMoreInfo,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-panel rounded-card p-5 elevation-raised flex flex-col min-h-[280px]
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-base font-bold text-text leading-tight">
          {productName}
        </h3>
        <div className="w-8 h-8 rounded-full bg-panel-strong elevation-inset shrink-0 overflow-hidden flex items-center justify-center">
          {badgeUrl ? (
            <img
              src={badgeUrl}
              alt="badge"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-3 h-3 rounded-full bg-primary/40" />
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-end mb-4">
        <span className="text-lg font-bold text-text">{currentPrice}</span>
        {originalPrice && (
          <span className="text-xs text-danger line-through opacity-80 decoration-2">
            {originalPrice}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <Button
          intent="accent"
          size="sm"
          fullWidth
          onClick={onAddToCart}
          className="!text-[10px] uppercase font-bold tracking-tighter"
        >
          Add To Cart
        </Button>
        <Button
          intent="accent"
          size="sm"
          fullWidth
          onClick={onCommunicate}
          className="!text-[10px] uppercase font-bold tracking-tighter"
        >
          Communicate
        </Button>
      </div>

      <button
        onClick={onMoreInfo}
        className="text-left text-[10px] text-text-muted hover:text-primary transition-colors italic"
      >
        more about {productName}
      </button>
    </div>
  );
};
