// [PHASE: marketplace-preview — Product catalog UI v2]
// TODO: confirm TMDA schedule and premises-licence requirement prior to launch [marketplace-preview]
import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { MessageCircle, Info } from 'lucide-react';
import { QtyStepper } from './QtyStepper';
import { UnitChip } from './UnitChip';
import { ProductImage } from './ProductImage';

export interface ProductCardProps {
  id: string;
  name: string;
  genericName?: string;
  subtitle?: string;
  unitPrice: number;
  oldUnitPrice?: number;
  stock: number | 'in' | 'low' | 'out';
  unitType?: string;
  form?: string;
  controlled?: boolean;
  mode: 'sale' | 'purchase';
  cartQty?: number;
  viewMode?: 'grid' | 'list';
  isPriceEditable?: boolean;
  onPriceChange?: (id: string, price: number) => void;
  onAddToCart?: () => void;
  onUpdateQty?: (qty: number) => void;
  onDetails?: () => void;
  onSeeAlternatives?: () => void;
  onChat?: () => void;
  disabled?: boolean;
  imageUrl?: string;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  genericName,
  unitPrice,
  oldUnitPrice,
  stock,
  unitType,
  form = 'tablet',
  controlled = false,
  mode,
  cartQty = 0,
  viewMode = 'grid',
  onAddToCart,
  onUpdateQty,
  onDetails,
  onSeeAlternatives,
  onChat,
  disabled = false,
  imageUrl,
  className = '',
}) => {
  const isOutOfStock = stock === 'out' || (typeof stock === 'number' && stock <= 0);
  const isLowStock = stock === 'low' || (typeof stock === 'number' && stock > 0 && stock <= 5);

  let discountPercent = 0;
  if (oldUnitPrice && oldUnitPrice > unitPrice) {
    discountPercent = Math.round(((oldUnitPrice - unitPrice) / oldUnitPrice) * 100);
  }

  const priceFormatted = `TZS ${unitPrice.toLocaleString()} /${unitType || 'pack'}`;

  if (viewMode === 'list') {
    return (
      <div
        className={[
          'flex items-center gap-3 p-3 rounded-card bg-panel border transition-all elevation-flat',
          isOutOfStock ? 'opacity-60 border-danger/30 bg-panel/60' : 'border-border/40 hover:border-primary hover:shadow-sm',
          className,
        ].join(' ')}
      >
        <ProductImage src={imageUrl} alt={name} form={form} variant="thumb" />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs font-bold text-text truncate" title={name}>
              {name}
            </p>
            {controlled && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                Controlled
              </span>
            )}
            <UnitChip unit={unitType} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            {genericName && <p className="text-[10px] text-text-muted italic truncate">{genericName}</p>}
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

        <div className="flex items-center gap-4 shrink-0 text-right">
          <div>
            <p className="text-xs font-mono font-bold text-primary">{priceFormatted}</p>
            {oldUnitPrice && oldUnitPrice > unitPrice && (
              <div className="flex items-center justify-end gap-1">
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
          {onDetails && (
            <Button size="sm" intent="ghost" onClick={onDetails} title="Details" className="!p-1.5 !h-7 !w-7">
              <Info size={14} />
            </Button>
          )}
          {onChat && (
            <Button size="sm" intent="secondary" onClick={onChat} title="Communicate" className="!p-1.5 !h-7 !w-7">
              <MessageCircle size={14} className="text-accent" />
            </Button>
          )}
          {isOutOfStock ? (
            onSeeAlternatives && (
              <Button size="sm" intent="secondary" onClick={onSeeAlternatives}>
                See alternatives
              </Button>
            )
          ) : cartQty === 0 ? (
            <Button size="sm" intent="primary" disabled={disabled} onClick={onAddToCart} className="!h-7 px-3">
              Add
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
  }

  // Grid Card Mode (default)
  return (
    <div
      className={[
        'flex flex-col rounded-card bg-panel border transition-all elevation-flat overflow-hidden',
        isOutOfStock ? 'opacity-60 border-danger/30 bg-panel/60' : 'border-border/40 hover:border-primary hover:shadow-md',
        className,
      ].join(' ')}
    >
      <div className="relative">
        <ProductImage src={imageUrl} alt={name} form={form} variant="card" />
        {controlled && (
          <span className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/90 text-white shadow">
            Controlled
          </span>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs font-bold text-text line-clamp-2" title={name}>
              {name}
            </h3>
            <UnitChip unit={unitType} />
          </div>
          {genericName && <p className="text-[10px] text-text-muted italic truncate">{genericName}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-mono font-bold text-primary">{priceFormatted}</p>
              {oldUnitPrice && oldUnitPrice > unitPrice && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-mono text-[10px] text-text-muted line-through">
                    TZS {oldUnitPrice.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-danger">-{discountPercent}%</span>
                </div>
              )}
            </div>
            {isOutOfStock ? (
              <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">Out</span>
            ) : isLowStock ? (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">Low</span>
            ) : (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">In stock</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/20 gap-2">
            <div className="flex items-center gap-1">
              {onDetails && (
                <Button size="sm" intent="ghost" onClick={onDetails} title="Details" className="!p-1.5 !h-7 !w-7">
                  <Info size={14} />
                </Button>
              )}
              {onChat && (
                <Button size="sm" intent="secondary" onClick={onChat} title="Communicate" className="!p-1.5 !h-7 !w-7">
                  <MessageCircle size={14} className="text-accent" />
                </Button>
              )}
            </div>

            <div>
              {isOutOfStock ? (
                onSeeAlternatives && (
                  <Button size="sm" intent="secondary" onClick={onSeeAlternatives} className="!h-7 text-[10px]">
                    See alternatives
                  </Button>
                )
              ) : cartQty === 0 ? (
                <Button size="sm" intent="primary" disabled={disabled} onClick={onAddToCart} className="!h-7 px-4">
                  Add
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
        </div>
      </div>
    </div>
  );
};
