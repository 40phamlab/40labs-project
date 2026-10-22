// [PHASE: marketplace-preview — Cart rebuild]
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
  form?: string;
  controlled?: boolean;
  unitChipOptions?: string[];
  selectedUnit?: string;
  onSelectUnit?: (unit: string) => void;
  discountAmount?: number;
  mode: 'sale' | 'purchase';
  isPriceEditable?: boolean;
  onPriceChange?: (id: string, price: number) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  imageUrl?: string;
  className?: string;
}

export const CartLine: React.FC<CartLineProps> = ({
  id,
  name,
  subtitle,
  unitPrice,
  quantity,
  maxStock,
  unitType = 'Pack',
  form = 'tablet',
  controlled = false,
  unitChipOptions,
  selectedUnit,
  onSelectUnit,
  discountAmount = 0,
  onQuantityChange,
  onRemove,
  imageUrl,
  className = '',
}) => {
  const lineTotal = unitPrice * quantity - discountAmount;

  return (
    <div
      className={[
        'flex items-center gap-3 p-3 rounded-card bg-panel-strong border border-border/40 elevation-raised',
        className,
      ].join(' ')}
    >
      <ProductImage src={imageUrl} alt={name} form={form} variant="thumb" />

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-xs font-bold text-text truncate min-w-0">{name}</h4>
          {controlled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              Controlled
            </span>
          )}
          {unitChipOptions && unitChipOptions.length > 1 && onSelectUnit ? (
            <select
              value={selectedUnit || unitType}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="text-[10px] font-bold px-1.5 py-0.5 bg-panel border border-border/30 rounded text-primary"
            >
              {unitChipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <UnitChip unit={unitType} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {subtitle && <span className="text-[10px] text-text-muted italic truncate">{subtitle}</span>}
          <div className="text-[10px] font-mono text-text-muted">
            <MoneyDisplay amount={unitPrice} emphasis="normal" /> / {unitType.toLowerCase()}
          </div>
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

      <div className="w-28 text-right shrink-0">
        <MoneyDisplay amount={lineTotal} emphasis="strong" className="text-xs font-mono font-bold text-primary" />
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
