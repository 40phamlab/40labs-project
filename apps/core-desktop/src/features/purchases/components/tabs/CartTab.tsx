// [PHASE: marketplace-preview — Storefront scroll + space]
import * as React from 'react';
import { SupplierCart, MarketplaceSupplier, CatalogProduct } from '@40labs/types';
import { ShoppingBag, Send, Trash2, ArrowRight } from 'lucide-react';
import { CartLine } from '../../../../shared/commerce';
import { Button, MoneyDisplay } from '@40labs/ui-components';

export interface CartTabProps {
  cart: SupplierCart;
  supplier: MarketplaceSupplier;
  catalogProducts: CatalogProduct[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveLine: (productId: string) => void;
  onClearCart: () => void;
  onSendOrder: (note?: string) => void;
  onSwitchTab: (tab: any) => void;
}

export const CartTab: React.FC<CartTabProps> = ({
  cart,
  supplier,
  catalogProducts,
  onUpdateQty,
  onRemoveLine,
  onClearCart,
  onSendOrder,
  onSwitchTab,
}) => {
  const [orderNote, setOrderNote] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const subtotal = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
  const totalItemCount = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  const hasControlledItems = React.useMemo(() => {
    return cart.lines.some((l) => {
      const prod = catalogProducts.find((p) => p.id === l.productId);
      return prod?.controlled;
    });
  }, [cart.lines, catalogProducts]);

  // Enter key handler when focus is inside cart
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && cart.lines.length > 0) {
        if (containerRef.current && containerRef.current.contains(document.activeElement)) {
          if (
            (document.activeElement as HTMLElement)?.tagName === 'TEXTAREA' ||
            (document.activeElement as HTMLElement)?.tagName === 'INPUT'
          ) {
            return;
          }
          e.preventDefault();
          onSendOrder(orderNote);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.lines.length, orderNote, onSendOrder]);

  const handleClearWithConfirm = () => {
    if (window.confirm('Are you sure you want to clear this cart? / Una hakika unataka kufuta gari hili?')) {
      onClearCart();
    }
  };

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-text-muted gap-4">
        <ShoppingBag size={48} className="opacity-30" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">Your cart for {supplier.name} is empty</h3>
          <p className="text-xs italic">Add products from the catalog tab to build your purchase order.</p>
        </div>
        <Button size="sm" intent="primary" onClick={() => onSwitchTab('products')} leftIcon={<ArrowRight size={14} />}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row gap-6 p-1 flex-1 min-h-0">
      {/* Left: List of CartLine */}
      <div className="flex-1 flex flex-col gap-3 pr-1 overflow-y-auto custom-scrollbar min-h-0">
        {hasControlledItems && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-card flex items-center gap-2 text-xs text-amber-700 font-bold">
            <span>⚠️ This order contains controlled substances and requires pharmacist step-up approval upon sending.</span>
          </div>
        )}

        {cart.lines.map((line) => {
          const product = catalogProducts.find((p) => p.id === line.productId);
          const name = product?.name || line.productId;
          const genericName = product?.genericName;
          const form = product?.form || 'tablet';
          const controlled = product?.controlled;
          const unitType = product?.packSize || 'Pack';
          const imageUrl = product?.imageUrl;

          return (
            <CartLine
              key={line.productId}
              id={line.productId}
              name={name}
              subtitle={genericName}
              unitPrice={line.unitPriceTzsSnapshot}
              quantity={line.qty}
              unitType={unitType}
              form={form}
              controlled={controlled}
              imageUrl={imageUrl}
              mode="purchase"
              onQuantityChange={(_id, qty) => onUpdateQty(line.productId, qty)}
              onRemove={onRemoveLine}
            />
          );
        })}
      </div>

      {/* Right: Sticky CartSummary (320px) */}
      <div className="w-full lg:w-[320px] shrink-0 sticky top-16 flex flex-col gap-4 bg-panel-strong/40 p-4 rounded-card border border-border/40 elevation-raised h-fit">
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text">Order Summary</h3>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Items ({totalItemCount})</span>
            <span className="font-mono">{totalItemCount} units</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Subtotal</span>
            <MoneyDisplay amount={subtotal} emphasis="normal" className="font-mono text-text" />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border/20">
            <span>Delivery Channel</span>
            <span className="font-bold text-accent">Via WhatsApp</span>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-border/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Order Note / Instructions</span>
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Add delivery instructions or notes for supplier..."
            className="w-full h-16 p-2 text-xs bg-panel border border-border/30 rounded-input text-text resize-none focus:border-primary"
          />
        </div>

        <div className="space-y-2 pt-3 border-t border-border/30">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Grand Total</span>
            <MoneyDisplay amount={subtotal} emphasis="strong" className="text-[28px] font-mono font-bold text-primary truncate" />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              intent="primary"
              size="md"
              onClick={() => onSendOrder(orderNote)}
              leftIcon={<Send size={16} />}
              className="w-full !py-3 font-bold"
            >
              Send order to {supplier.name}
            </Button>

            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={handleClearWithConfirm}
              leftIcon={<Trash2 size={14} />}
              className="w-full text-text-muted hover:text-danger hover:bg-danger/10"
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
