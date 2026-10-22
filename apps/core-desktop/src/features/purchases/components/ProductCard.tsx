// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { StockChip } from './StockChip';
import { Plus, Minus, MessageCircle, Info } from 'lucide-react';
import { normalizeToE164 } from '../data/channels/phone';

export interface ProductCardProps {
  product: CatalogProduct;
  cartQty?: number;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onMoreAbout: (product: CatalogProduct) => void;
  onSeeAlternatives: (product: CatalogProduct) => void;
  supplierPhone?: string;
  supplierName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQty = 0,
  onAddToCart,
  onUpdateQty,
  onMoreAbout,
  onSeeAlternatives,
  supplierPhone,
  supplierName = 'Supplier',
}) => {
  const isOut = product.stock === 'out';
  const priceFormatted = `TZS ${product.unitPriceTzs.toLocaleString()} /${product.packSize || 'pack'}`;

  let discountPercent = 0;
  if (product.oldUnitPriceTzs && product.oldUnitPriceTzs > product.unitPriceTzs) {
    discountPercent = Math.round(
      ((product.oldUnitPriceTzs - product.unitPriceTzs) / product.oldUnitPriceTzs) * 100
    );
  }

  const handleCommunicate = () => {
    const rawPhone = supplierPhone || '+255700000000';
    const e164 = normalizeToE164(rawPhone);
    const phoneClean = e164 ? e164.replace('+', '') : '255700000000';
    const msg = encodeURIComponent(
      `Hello ${supplierName}, I am inquiring about product: ${product.name} (${product.packSize}), quantity: ${cartQty || 1}. Buyer ID: AFYA-MYPHARMACY.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${msg}`, '_blank');
  };

  return (
    <div className={`
      p-4 bg-panel border rounded-card flex flex-col justify-between gap-3 elevation-raised transition-all
      ${isOut ? 'border-danger/30 bg-panel/60 opacity-80' : 'border-border/40 hover:border-primary/40'}
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-text truncate" title={product.name}>
            {product.name}
          </h4>
          <p className="text-xs text-text-muted truncate">{product.genericName} • {product.form}</p>
        </div>
        <StockChip stock={product.stock} />
      </div>

      <div className="flex items-baseline gap-2 pt-1">
        <span className="font-mono font-bold text-text text-sm">{priceFormatted}</span>
        {product.oldUnitPriceTzs && product.oldUnitPriceTzs > product.unitPriceTzs && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-text-muted line-through">
              TZS {product.oldUnitPriceTzs.toLocaleString()}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger font-mono">
              -{discountPercent}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
        <button
          type="button"
          onClick={() => onMoreAbout(product)}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          <Info size={12} /> More about
        </button>

        {isOut ? (
          <Button size="sm" intent="secondary" onClick={() => onSeeAlternatives(product)}>
            See Alternatives
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              intent="secondary"
              leftIcon={<MessageCircle size={14} className="text-accent" />}
              onClick={handleCommunicate}
              title="Communicate via WhatsApp"
            >
              Chat
            </Button>

            {cartQty === 0 ? (
              <Button
                size="sm"
                intent="primary"
                onClick={() => onAddToCart(product, 1)}
              >
                Add to cart
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-primary/10 p-1 rounded-input border border-primary/30">
                <button
                  onClick={() => onUpdateQty(product.id, cartQty - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Minus size={12} />
                </button>
                <span className="font-mono text-xs font-bold px-2 text-primary">{cartQty}</span>
                <button
                  onClick={() => onUpdateQty(product.id, cartQty + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
