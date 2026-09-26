import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@40labs/ui-components';

export interface ProductRowProps {
  name: string;
  sku?: string;
  stock: number;
  price: number;
  onAdd?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  name,
  sku,
  stock,
  price,
  onAdd,
  disabled = false,
  className = '',
}) => {
  const isOutOfStock = stock <= 0;

  return (
    <div
      className={[
        'flex items-center gap-3 p-2.5 rounded-card bg-panel hover:bg-panel-strong/80 transition-all border border-border/30 elevation-flat',
        isOutOfStock ? 'opacity-60' : '',
        className,
      ].join(' ')}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-bold text-text truncate">{name}</p>
          {isOutOfStock && (
            <Badge variant="danger" className="shrink-0 text-[8px] px-1 py-0 h-3.5">
              Out of stock
            </Badge>
          )}
        </div>
        {sku && <p className="text-[10px] font-mono text-text-muted italic truncate">{sku}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0 justify-end">
        <div className="text-right">
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Stock</p>
          <p className="text-xs font-mono font-medium text-text">{stock}</p>
        </div>
        <div className="text-right min-w-[70px]">
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Price</p>
          <p className="text-xs font-mono font-bold text-primary">
            TZS {price.toLocaleString()}
          </p>
        </div>
      </div>

      {onAdd && (
        <Button
          size="sm"
          intent={isOutOfStock ? 'neutral' : 'primary'}
          disabled={disabled || isOutOfStock}
          className="!p-1.5 !h-7 !w-7 !min-w-0 shrink-0"
          onClick={onAdd}
          aria-label={`Add ${name} to cart`}
        >
          <Plus size={14} />
        </Button>
      )}
    </div>
  );
};
