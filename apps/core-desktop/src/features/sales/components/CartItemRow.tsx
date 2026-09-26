import * as React from 'react';
import { Trash2, Pill } from 'lucide-react';
import { Badge, IconButton, QuantityStepper, MoneyDisplay } from '@40labs/ui-components';

export interface CartItemModel {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number;
  unitType?: string;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  discountAmount?: number;
}

export interface CartItemRowProps {
  item: CartItemModel;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onQuantityChange,
  onRemove,
  className = '',
}) => {
  if (!item) return null;
  const subtotal = item.unitPrice * item.quantity - (item.discountAmount || 0);

  return (
    <div
      className={[
        'flex items-center gap-3 p-2.5 rounded-card bg-panel-strong border border-border/40 elevation-raised',
        className,
      ].join(' ')}
    >
      <div className="w-8 h-8 shrink-0 rounded-input bg-panel border border-border/20 flex items-center justify-center text-primary">
        <Pill size={16} />
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-xs font-bold text-text truncate min-w-0">{item.name}</h4>
          {item.unitType && (
            <Badge variant="neutral" className="shrink-0 text-[8px] opacity-70 px-1 py-0 h-3.5 flex items-center">
              {item.unitType}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">
          <MoneyDisplay amount={item.unitPrice} emphasis="normal" /> / unit
        </p>
      </div>

      <div className="shrink-0">
        <QuantityStepper
          value={item.quantity}
          min={1}
          max={item.maxStock}
          size="sm"
          onChange={(newQty) => onQuantityChange(item.id, newQty)}
        />
      </div>

      <div className="w-24 text-right shrink-0">
        <MoneyDisplay amount={subtotal} emphasis="strong" className="text-xs text-primary" />
      </div>

      <IconButton
        icon={<Trash2 size={14} />}
        label="Remove item"
        intent="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="shrink-0 text-text-muted hover:text-danger"
      />
    </div>
  );
};
