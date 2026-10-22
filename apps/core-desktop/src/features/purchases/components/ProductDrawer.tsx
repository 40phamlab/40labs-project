// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { Modal, Button } from '@40labs/ui-components';
import { StockChip } from './StockChip';
import { MessageCircle, Plus, Minus } from 'lucide-react';
import { normalizeToE164 } from '../data/channels/phone';

export interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
  cartQty?: number;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  supplierPhone?: string;
  supplierName?: string;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  isOpen,
  onClose,
  product,
  cartQty = 0,
  onAddToCart,
  onUpdateQty,
  supplierPhone,
  supplierName = 'Supplier',
}) => {
  if (!product) return null;

  const priceFormatted = `TZS ${product.unitPriceTzs.toLocaleString()} /${product.packSize || 'pack'}`;

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
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="md">
      <div className="flex flex-col gap-4 p-2 text-xs">
        <div className="p-3 bg-panel-strong rounded-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Generic Name</span>
            <span className="font-bold text-text">{product.genericName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Form & Pack</span>
            <span className="font-medium text-text">{product.form} • {product.packSize}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Stock Status</span>
            <StockChip stock={product.stock} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <span className="text-text-muted uppercase text-[10px] font-bold">Price</span>
            <span className="font-mono font-bold text-primary text-sm">{priceFormatted}</span>
          </div>
        </div>

        {/* Price History Placeholder */}
        <div className="p-3 bg-panel border border-border/30 rounded-card space-y-1">
          <h4 className="font-bold text-text uppercase text-[10px] tracking-wider">Price History & Trends</h4>
          <p className="text-[11px] text-text-muted italic">TODO: price history [V2]</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/20">
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<MessageCircle size={14} className="text-accent" />}
            onClick={handleCommunicate}
          >
            Communicate via WhatsApp
          </Button>

          {product.stock !== 'out' && (
            <div className="flex items-center gap-2">
              {cartQty === 0 ? (
                <Button
                  intent="primary"
                  size="sm"
                  onClick={() => onAddToCart(product, 1)}
                >
                  Add to Cart
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
    </Modal>
  );
};
