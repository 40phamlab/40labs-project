import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@40labs/ui-components';

export interface ProductRowProps {
  name: string;
  sku?: string;
  stock: number | string;
  price: number | string;
  onAdd?: () => void;
  className?: string;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  name,
  sku,
  stock,
  price,
  onAdd,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 p-2 min-h-[56px] rounded-input bg-panel hover:bg-panel-strong transition-colors border border-border/10 ${className}`}>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-xs font-semibold text-text truncate">{name}</p>
        {sku && <p className="text-tiny font-mono text-text-muted uppercase tracking-tighter truncate">{sku}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0 justify-end">
        <div className="text-right">
          <p className="text-tiny text-text-muted uppercase tracking-widest text-[8px]">Stock</p>
          <p className="text-xs font-mono text-text truncate">{stock}</p>
        </div>
        <div className="text-right min-w-[75px]">
          <p className="text-tiny text-text-muted uppercase tracking-widest text-[8px]">Price</p>
          <p className="text-xs font-mono font-bold text-primary truncate">{price}</p>
        </div>
      </div>
      {onAdd && (
        <Button size="sm" intent="primary" className="!p-1 !h-7 !w-7 !min-w-0 shrink-0" onClick={onAdd}>
          <Plus size={14} />
        </Button>
      )}
    </div>
  );
};
