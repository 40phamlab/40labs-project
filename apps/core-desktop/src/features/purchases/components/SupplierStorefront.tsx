// [PHASE: marketplace-preview]
import * as React from 'react';
import { TabbedListContainer } from '@40labs/ui-components';
import { CheckCircle2 } from 'lucide-react';
import type { MarketplaceSupplier, CatalogProduct } from '@40labs/types';
import { SupplierStorefrontHeader } from './SupplierStorefrontHeader';
import { SupplierProductsTab } from './SupplierProductsTab';
import { CartTab } from './tabs/CartTab';
import { useSendOrder } from '../hooks/useSendOrder';
import { SupplierDealsTab, SupplierDealEntry } from './SupplierDealsTab';
import { useCatalogQuery, useCartQuery, useOrdersQuery, useMarketplaceMutations, useFollowedSuppliersQuery } from '../hooks/usePurchasesMarketplace';
import { WhatsAppChannel } from '../data/channels/WhatsAppChannel';
import { Button } from '@40labs/ui-components';

export interface SupplierStorefrontProps {
  supplier: MarketplaceSupplier;
  initialTab?: string;
  onNavigate: (route: string) => void;
}

export const SupplierStorefront: React.FC<SupplierStorefrontProps> = ({
  supplier,
  initialTab = 'products',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const { data: catalog = [] } = useCatalogQuery(undefined, supplier.businessId);
  const { data: cart = { id: '', supplierBusinessId: supplier.businessId, lines: [] } } = useCartQuery(supplier.businessId);
  const { data: supplierOrders = [] } = useOrdersQuery('recently');
  const { data: followedSuppliers = [] } = useFollowedSuppliersQuery();

  const { toggleFollow, updateCart, createOrder } = useMarketplaceMutations();
  const whatsappChannel = React.useMemo(() => new WhatsAppChannel(), []);

  const [isFollowed, setIsFollowed] = React.useState(true);
  const [isOrderConfirmed, setIsOrderConfirmed] = React.useState(false);

  const handleToggleFollow = async () => {
    const nextState = !isFollowed;
    setIsFollowed(nextState);
    await toggleFollow(supplier.businessId, nextState);
  };

  const handleAddToCart = async (product: CatalogProduct) => {
    await updateCart(supplier.businessId, {
      productId: product.id,
      qty: 1,
      unitPriceTzsSnapshot: product.unitPriceTzs,
    });
  };

  const handleUpdateQty = async (productId: string, qty: number) => {
    const existing = cart.lines.find((l) => l.productId === productId);
    if (!existing) return;
    await updateCart(supplier.businessId, {
      productId,
      qty,
      unitPriceTzsSnapshot: existing.unitPriceTzsSnapshot,
    });
  };

  const handleRemoveLine = async (productId: string) => {
    await updateCart(supplier.businessId, {
      productId,
      qty: 0,
      unitPriceTzsSnapshot: 0,
    });
  };

  const { sendOrder } = useSendOrder(() => {
    setIsOrderConfirmed(true);
  });

  const handleSendOrderWithNote = async (note?: string) => {
    await sendOrder(supplier, cart, note);
  };

  const supplierDeals = React.useMemo(() => {
    const ordersForThisSupplier = supplierOrders.filter((o) => o.sellerBusinessId === supplier.businessId);
    const dealEntries: SupplierDealEntry[] = [];
    ordersForThisSupplier.forEach((po) => {
      po.lines.forEach((line, idx) => {
        const catalogProd = catalog.find((p) => p.id === line.productId);
        const productName = catalogProd?.name || line.name || `Medicine (${line.productId})`;
        const currentPriceNum = line.unitPriceTzsSnapshot;
        dealEntries.push({
          id: `${po.id}_deal_${idx}_${line.productId}`,
          poId: po.id,
          medicine_id: line.productId,
          productName,
          currentPriceNum,
          currentPriceFormatted: `TZS ${currentPriceNum.toLocaleString()}`,
        });
      });
    });
    return dealEntries;
  }, [supplierOrders, supplier.businessId, catalog]);

  const subtotal = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
  const totalCartCount = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  const tabs = [
    { id: 'products', label: 'Products', count: catalog.length },
    { id: 'cart', label: 'Cart', count: totalCartCount },
    { id: 'deals', label: 'Deals', count: supplierDeals.length },
  ];

  return (
    <div className="flex flex-col gap-4 h-full bg-panel p-5 rounded-card border border-border/50 elevation-raised overflow-hidden">
      <SupplierStorefrontHeader
        supplier={supplier}
        isFollowed={isFollowed}
        onToggleFollow={handleToggleFollow}
        onViewProfile={() => onNavigate(`#purchases/supplier/${supplier.businessId}/profile`)}
        onNavigate={onNavigate}
      />

      {isOrderConfirmed && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-card flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <CheckCircle2 size={16} />
            <span>Order successfully sent via WhatsApp & recorded in outbox!</span>
          </div>
          <Button size="sm" intent="ghost" onClick={() => setIsOrderConfirmed(false)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TabbedListContainer
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          scrollable={activeTab !== 'cart'}
        >
          {activeTab === 'products' && (
            <SupplierProductsTab
              products={catalog}
              cart={cart}
              onAddToCart={async (product, qty) => {
                await updateCart(supplier.businessId, {
                  productId: product.id,
                  qty,
                  unitPriceTzsSnapshot: product.unitPriceTzs,
                });
              }}
              onUpdateQty={handleUpdateQty}
              supplierPhone={supplier.phones[0]}
              supplierName={supplier.name}
              followedSupplierIds={followedSuppliers.map((s) => s.businessId)}
              onNavigateToSupplier={(id) => onNavigate(`#purchases/supplier/${id}`)}
            />
          )}

          {activeTab === 'cart' && (
            <CartTab
              cart={cart}
              supplier={supplier}
              catalogProducts={catalog}
              onUpdateQty={handleUpdateQty}
              onRemoveLine={handleRemoveLine}
              onClearCart={() => cart.lines.forEach((l) => handleRemoveLine(l.productId))}
              onSendOrder={handleSendOrderWithNote}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'deals' && (
            <SupplierDealsTab
              supplierName={supplier.name}
              deals={supplierDeals}
              onAddDealToCart={(id, price, name) => {
                handleAddToCart({
                  id,
                  supplierBusinessId: supplier.businessId,
                  name,
                  genericName: '',
                  form: '',
                  packSize: 'Pack',
                  unitPriceTzs: price,
                  stock: 'in',
                  medicineKey: '',
                });
                setActiveTab('cart');
              }}
              onCommunicate={() => {}}
              onMoreInfo={() => {}}
            />
          )}
        </TabbedListContainer>
      </div>
    </div>
  );
};
