import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { IconButton, MoneyDisplay } from '@40labs/ui-components';
import { QtyStepper } from './QtyStepper';
import { UnitChip } from './UnitChip';
import { ProductImage } from './ProductImage';

export interface CartLineProps {
  id: string;
  name: string;
  subtitle?: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number;
  unitType?: string;
  stockStatus?: string;
  discountAmount?: number;
  mode: 'sale' | 'purchase';
  isPriceEditable?: boolean;
  onPriceChange?: (id: string, price: number) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const CartLine: React.FC<CartLineProps> = ({
  id,
  name,
  subtitle,
  unitPrice,
  quantity,
  maxStock,
  unitType,
  discountAmount = 0,
  mode,
  isPriceEditable = false,
  onPriceChange,
  onQuantityChange,
  onRemove,
  className = '',
}) => {
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [editablePrice, setEditablePrice] = React.useState(String(unitPrice));

  const subtotal = unitPrice * quantity - discountAmount;

  const handlePriceBlur = () => {
    setIsEditingPrice(false);
    const parsed = Number(editablePrice);
    if (!isNaN(parsed) && parsed >= 0 && onPriceChange) {
      onPriceChange(id, parsed);
    } else {
      setEditablePrice(String(unitPrice));
    }
  };

  return (
    <div
      className={[
        'flex items-center gap-3 p-2.5 rounded-card bg-panel-strong border border-border/40 elevation-raised',
        className,
      ].join(' ')}
    >
      <ProductImage />

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-xs font-bold text-text truncate min-w-0">{name}</h4>
          <UnitChip unit={unitType} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {subtitle && <span className="text-[10px] text-text-muted font-mono">{subtitle}</span>}
          {mode === 'sale' && isPriceEditable && isEditingPrice ? (
            <input
              type="number"
              autoFocus
              value={editablePrice}
              onChange={(e) => setEditablePrice(e.target.value)}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
              className="w-20 px-1 py-0.5 text-[10px] font-mono bg-panel border border-primary rounded"
            />
          ) : (
            <div
              onClick={() => {
                if (mode === 'sale' && isPriceEditable) setIsEditingPrice(true);
              }}
              className={mode === 'sale' && isPriceEditable ? 'cursor-pointer hover:text-primary text-[10px]' : 'text-[10px]'}
              title={mode === 'sale' && isPriceEditable ? 'Click to edit unit price' : undefined}
            >
              <MoneyDisplay amount={unitPrice} emphasis="normal" /> / unit
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <QtyStepper
          value={quantity}
          min={1}
          max={maxStock}
          size="sm"
          onChange={(newQty) => onQuantityChange(id, newQty)}
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
        onClick={() => onRemove(id)}
        className="shrink-0 text-text-muted hover:text-danger"
      />
    </div>
  );
};
