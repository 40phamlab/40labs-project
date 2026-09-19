import { Trash2, Image as ImageIcon, Plus, Minus } from 'lucide-react';
import { Button } from '../primitives/Button';

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
 * Redesigned for vertical controls and stacked layout.
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

  return (
    <div className={`flex items-start gap-4 p-3 rounded-card bg-panel-strong elevation-raised border border-border/10 ${className}`}>
      {/* Large Square Thumbnail */}
      <div className="w-24 h-24 shrink-0 rounded-card bg-field elevation-inset overflow-hidden flex items-center justify-center relative border border-border/5">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-20">
            <ImageIcon size={32} className="text-text-muted" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">No Image</span>
          </div>
        )}
        {item.stockStatus && (
          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-surface shadow-sm ${
            item.stockStatus === 'in-stock' ? 'bg-primary' :
            item.stockStatus === 'low-stock' ? 'bg-accent' : 'bg-danger'
          }`} />
        )}
      </div>

      {/* Middle: Stacked Details */}
      <div className="flex-1 flex flex-col gap-1 min-w-0 pt-1">
        <h4 className="text-sm font-bold text-text truncate leading-tight">
          {item.name}
        </h4>

        <div className="flex flex-col gap-0.5 mt-1">
          <p className="text-[10px] font-medium text-text-muted flex items-center gap-1">
            <span className="opacity-50 uppercase tracking-widest text-[8px]">Qty:</span>
            <span className="text-text">{item.quantity} {item.unitType}</span>
          </p>
          <p className="text-[10px] font-medium text-text-muted flex items-center gap-1">
            <span className="opacity-50 uppercase tracking-widest text-[8px]">Price:</span>
            <span className="font-mono text-text">{currencyFormatter(item.unitPrice, currency)}</span>
          </p>
        </div>

        <div className="mt-auto pt-2">
          <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-bold opacity-50">
            Subtotal
          </p>
          <p className="text-base font-mono font-bold text-primary leading-none mt-0.5">
            {currencyFormatter(subtotal, currency)}
          </p>
        </div>
      </div>

      {/* Right: Vertical Controls */}
      <div className="flex flex-col gap-3 shrink-0 h-full justify-between min-w-[80px]">
        {/* Vertical Stepper */}
        <div className="flex flex-col items-center bg-panel rounded-lg p-1 border border-border/20 shadow-sm">
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-panel-strong text-primary transition-all active:scale-90"
          >
            <Plus size={18} />
          </button>

          <div className="h-8 flex items-center justify-center">
            <span className="font-mono font-black text-sm text-text">
              {item.quantity}
            </span>
          </div>

          <button
            onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-panel-strong text-text transition-all active:scale-90"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* Remove Button */}
        <Button
          intent="neutral"
          size="sm"
          fullWidth
          className="rounded-full !bg-text !text-surface border-none !text-[9px] !h-7 uppercase tracking-widest font-bold shadow-surface-pop hover:shadow-none transition-shadow"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};
