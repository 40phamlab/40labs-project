import * as React from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';
import { QuantityControl } from './Commerce';

export interface CartItemModel {
  id: string | number;
  name: string;
  unitPrice: number;
  quantity: number;
  unitType?: string; // e.g. "Strip", "Bottle", "Box"
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  discountAmount?: number;
  thumbnailUrl?: string;
  currencyCode?: string;
}

export interface CartItemRowProps {
  item: CartItemModel;
  onQuantityChange: (id: string | number, qty: number) => void;
  onRemove: (id: string | number) => void;
  currencyFormatter?: (value: number, currency: string) => string;
  className?: string;
}

const defaultFormatter = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

/**
 * CartItemRow composite component for rendering drug/item entries in a commerce cart.
 * Refactored for dynamic API models supporting unit types and stock statuses.
 */
export const CartItemRow = ({
  item,
  onQuantityChange,
  onRemove,
  currencyFormatter = defaultFormatter,
  className = '',
}: CartItemRowProps) => {
  if (!item) return null;
  const currency = item.currencyCode || 'TZS';
  const subtotal = (item.unitPrice * item.quantity) - (item.discountAmount || 0);

  const stockStatusColors = {
    'in-stock': 'bg-primary/20 text-primary',
    'low-stock': 'bg-accent/20 text-accent',
    'out-of-stock': 'bg-danger/20 text-danger',
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-card bg-panel-strong elevation-raised border border-border/10 ${className}`}>
      {/* Thumbnail */}
      <div className="w-12 h-12 shrink-0 rounded-input bg-field elevation-inset overflow-hidden flex items-center justify-center relative">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={18} className="text-text-muted/30" />
        )}
        {item.stockStatus && (
          <div className={`absolute top-0 right-0 w-2 h-2 rounded-full border border-surface ${item.stockStatus === 'in-stock' ? 'bg-primary' : item.stockStatus === 'low-stock' ? 'bg-accent' : 'bg-danger'}`} />
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-text truncate leading-tight">{item.name}</p>
          {item.unitType && (
            <span className="px-1 py-0.5 rounded-sm bg-panel text-[8px] font-bold text-text-muted uppercase">
              {item.unitType}
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-tighter mt-0.5">
          Unit: {currencyFormatter(item.unitPrice, currency)}
        </p>
      </div>

      {/* Stepper Control */}
      <QuantityControl
        value={item.quantity}
        onIncrement={() => onQuantityChange(item.id, item.quantity + 1)}
        onDecrement={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
        size="sm"
      />

      {/* Calculated Subtotal */}
      <div className="w-24 text-right">
        <p className="text-[10px] text-text-muted uppercase tracking-widest text-[8px] opacity-50">Total</p>
        <p className="text-xs font-mono font-bold text-primary">
          {currencyFormatter(subtotal, currency)}
        </p>
      </div>

      {/* Remove Action */}
      <IconButton
        icon={<Trash2 size={14} />}
        label="Remove item"
        intent="ghost"
        size="sm"
        className="hover:text-danger"
        onClick={() => onRemove(item.id)}
      />
    </div>
  );
};
