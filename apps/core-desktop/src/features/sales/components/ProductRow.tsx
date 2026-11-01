import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { ProductImage } from '../../../shared/commerce';

export interface ProductRowProps {
  name: string;
  stock: number;
  price: number;
  unitType?: string;
  onAdd?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  name,
  stock,
  price,
  unitType = 'pack',
  onAdd,
  disabled = false,
  className = '',
}) => {
  const isOutOfStock = stock <= 0;
  const priceFormatted = `TZS ${price.toLocaleString()} /${unitType}`;

  return (
    <div
      className={[
        'flex items-center gap-2 p-2 rounded-card bg-panel border transition-all elevation-flat',
        isOutOfStock ? 'opacity-60 border-danger/30 bg-panel/60' : 'border-border/40 hover:border-primary hover:shadow-sm',
        className,
      ].join(' ')}
    >
      {/* Medicine Icon */}
      <ProductImage alt={name} variant="thumb" className="w-8 h-8 shrink-0" />

      {/* Full Medicine Name */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-1">
        <p className="text-[11px] font-bold text-text break-words line-clamp-2 leading-tight" title={name}>
          {name}
        </p>
      </div>

      {/* TZS Price / Unit */}
      <div className="shrink-0 text-right px-1">
        <p className="text-[10px] font-mono font-bold text-primary whitespace-nowrap">
          {priceFormatted}
        </p>
      </div>

      {/* Add Button */}
      <div className="shrink-0">
        <Button
          size="sm"
          intent="primary"
          disabled={disabled || isOutOfStock}
          onClick={onAdd}
          className="!h-6 px-2 text-[10px] font-bold"
        >
          Add
        </Button>
      </div>
    </div>
  );
};

