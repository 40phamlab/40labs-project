import * as React from 'react';
import { Button, MoneyDisplay } from '@40labs/ui-components';
import { Plus, MessageCircle, Info } from 'lucide-react';
import { QtyStepper } from './QtyStepper';
import { UnitChip } from './UnitChip';
import { ProductImage } from './ProductImage';

export interface ProductCardProps {
  id: string;
  name: string;
  subtitle?: string;
  unitPrice: number;
  oldUnitPrice?: number;
  stock: number | 'in' | 'low' | 'out';
  unitType?: string;
  mode: 'sale' | 'purchase';
  cartQty?: number;
  isPriceEditable?: boolean;
  onPriceChange?: (id: string, price: number) => void;
  onAddToCart?: () => void;
  onUpdateQty?: (qty: number) => void;
  onMoreAbout?: () => void;
  onSeeAlternatives?: () => void;
  onChat?: () => void;
  disabled?: boolean;
  imageSrc?: string;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  subtitle,
  unitPrice,
  oldUnitPrice,
  stock,
  unitType,
  mode,
  cartQty = 0,
  isPriceEditable = false,
  onPriceChange,
  onAddToCart,
  onUpdateQty,
  onMoreAbout,
  onSeeAlternatives,
  onChat,
  disabled = false,
  imageSrc,
  className = '',
}) => {
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [editablePrice, setEditablePrice] = React.useState(String(unitPrice));

  const isOutOfStock =
    stock === 'out' || (typeof stock === 'number' && stock <= 0);
  const isLowStock = stock === 'low' || (typeof stock === 'number' && stock > 0 && stock <= 5);

  let discountPercent = 0;
  if (oldUnitPrice && oldUnitPrice > unitPrice) {
    discountPercent = Math.round(((oldUnitPrice - unitPrice) / oldUnitPrice) * 100);
  }

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
        'flex items-center gap-3 p-3 rounded-card bg-panel border transition-all elevation-flat',
        isOutOfStock ? 'opacity-60 border-danger/30 bg-panel/60' : 'border-border/40 hover:border-primary/40',
        className,
      ].join(' ')}
    >
      <ProductImage src={imageSrc} />

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-bold text-text truncate" title={name}>
            {name}
          </p>
          <UnitChip unit={unitType} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          {subtitle && <p className="text-[10px] font-mono text-text-muted truncate">{subtitle}</p>}
          {isOutOfStock && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 shrink-0">
              Out of stock
            </span>
          )}
          {isLowStock && mode === 'purchase' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              Low stock
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 justify-end">
        {mode === 'purchase' && (
          <div className="text-right">
            <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Stock</p>
            <p className="text-xs font-mono font-medium text-text">
              {typeof stock === 'number' ? stock : stock.toUpperCase()}
            </p>
          </div>
        )}

        <div className="text-right min-w-[80px]">
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Price</p>
          {mode === 'sale' && isPriceEditable && isEditingPrice ? (
            <input
              type="number"
              autoFocus
              value={editablePrice}
              onChange={(e) => setEditablePrice(e.target.value)}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
              className="w-20 px-1 py-0.5 text-xs font-mono bg-panel-strong border border-primary rounded text-right"
            />
          ) : (
            <div
              onClick={() => {
                if (mode === 'sale' && isPriceEditable) setIsEditingPrice(true);
              }}
              className={mode === 'sale' && isPriceEditable ? 'cursor-pointer hover:text-primary' : ''}
              title={mode === 'sale' && isPriceEditable ? 'Click to edit price' : undefined}
            >
              <MoneyDisplay amount={unitPrice} emphasis="strong" className="text-xs font-bold text-primary" />
            </div>
          )}
          {oldUnitPrice && oldUnitPrice > unitPrice && (
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="font-mono text-[10px] text-text-muted line-through">
                TZS {oldUnitPrice.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-danger">-{discountPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onMoreAbout && (
          <Button size="sm" intent="ghost" onClick={onMoreAbout} title="More information" className="!p-1.5 !h-7 !w-7">
            <Info size={14} />
          </Button>
        )}
        {onChat && (
          <Button size="sm" intent="secondary" onClick={onChat} title="Chat with supplier" className="!p-1.5 !h-7 !w-7">
            <MessageCircle size={14} className="text-accent" />
          </Button>
        )}
        {isOutOfStock ? (
          onSeeAlternatives && (
            <Button size="sm" intent="secondary" onClick={onSeeAlternatives}>
              Alternatives
            </Button>
          )
        ) : cartQty === 0 ? (
          <Button
            size="sm"
            intent="primary"
            disabled={disabled}
            onClick={onAddToCart}
            className="!h-7 px-3"
          >
            {mode === 'purchase' ? 'Add' : <Plus size={14} />}
          </Button>
        ) : (
          <QtyStepper
            value={cartQty}
            onChange={(newQty) => {
              if (onUpdateQty) onUpdateQty(newQty);
            }}
          />
        )}
      </div>
    </div>
  );
};
