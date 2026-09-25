import { Trash2, Image as ImageIcon, Minus, Plus } from 'lucide-react';
import { Badge, IconButton } from '@40labs/ui-components';

export interface CartItemModel {
  id: string | number;
  name: string;
  unitPrice: number;
  quantity: number;
  unitType?: string;
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
    <div className={`flex items-center gap-2 p-2 rounded-card bg-panel-strong elevation-raised border border-border/10 ${className}`}>
      <div className="w-10 h-10 shrink-0 rounded-input bg-field elevation-inset overflow-hidden flex items-center justify-center relative border border-border/5">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-field flex items-center justify-center text-text-muted/30">
            <ImageIcon size={16} />
          </div>
        )}
        {item.stockStatus && (
          <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-surface shadow-sm ${
            item.stockStatus === 'in-stock' ? 'bg-primary' :
            item.stockStatus === 'low-stock' ? 'bg-accent' : 'bg-danger'
          }`} />
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-xs font-semibold text-text truncate min-w-0">
            {item.name}
          </h4>
          {item.unitType && (
            <Badge variant="neutral" className="shrink-0 text-[8px] opacity-70 px-1 py-0 h-3.5 flex items-center">
              {item.unitType}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">
          @{currencyFormatter(item.unitPrice, currency)}
        </p>
      </div>

      <div className="flex items-center bg-panel-strong rounded-full p-0.5 elevation-inset shrink-0">
        <button
          onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-panel text-text"
        >
          <Minus size={12} />
        </button>
        <span className="font-mono font-bold text-text text-center min-w-[20px] text-xs">
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-panel text-primary"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="w-20 text-right shrink-0">
        <span className="font-mono text-xs font-bold text-primary">
          {currencyFormatter(subtotal, currency)}
        </span>
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
