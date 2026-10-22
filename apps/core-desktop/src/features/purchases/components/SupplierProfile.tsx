// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { Supplier, CatalogProduct } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { ArrowLeft, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { VerificationBadges } from './VerificationBadges';
import { FollowButton } from './FollowButton';
import { SupplierAvailability } from './SupplierAvailability';
import { SupplierServices } from './SupplierServices';
import { ProductsTab } from './tabs/ProductsTab';
import { CartTab } from './tabs/CartTab';
import { DealsTab } from './tabs/DealsTab';
import { useCartQuery, useOrdersQuery, useMarketplaceMutations, useCatalogQuery } from '../hooks/usePurchasesMarketplace';
import { WhatsAppChannel } from '../data/channels/WhatsAppChannel';

export interface SupplierProfileProps {
  supplier: Supplier;
  onBack: () => void;
  onSelectOrder: (orderId: string) => void;
}

type SupplierSubTab = 'products' | 'cart' | 'deals';

export const SupplierProfile: React.FC<SupplierProfileProps> = ({
  supplier,
  onBack,
  onSelectOrder,
}) => {
  const [activeTab, setActiveTab] = React.useState<SupplierSubTab>('products');
  const [isFollowed, setIsFollowed] = React.useState(true);

  const { data: catalog = [] } = useCatalogQuery(undefined, supplier.businessId);
  const { data: cart = { id: '', supplierBusinessId: supplier.businessId, lines: [] } } = useCartQuery(supplier.businessId);
  const { data: supplierOrders = [] } = useOrdersQuery('recently');

  const ordersForThisSupplier = React.useMemo(() => {
    return supplierOrders.filter((o) => o.sellerBusinessId === supplier.businessId);
  }, [supplierOrders, supplier.businessId]);

  const { toggleFollow, updateCart, createOrder } = useMarketplaceMutations();
  const whatsappChannel = React.useMemo(() => new WhatsAppChannel(), []);

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

  const handleSendOrder = async () => {
    if (cart.lines.length === 0) return;
    const newOrder = await createOrder(supplier.businessId, cart, 'whatsapp');
    await whatsappChannel.send(newOrder, supplier);
  };

  const totalCartCount = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  const subTabs = [
    { id: 'products' as SupplierSubTab, label: 'Products', count: catalog.length },
    { id: 'cart' as SupplierSubTab, label: 'Cart', count: totalCartCount },
    { id: 'deals' as SupplierSubTab, label: 'Deals', count: ordersForThisSupplier.length },
  ];

  const isVerified = supplier.verification.verified40Labs && supplier.verification.tmda;

  return (
    <div className="flex flex-col gap-4 h-full bg-panel p-4 rounded-card border border-border/50 elevation-raised overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <Button intent="secondary" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={onBack}>
          Back to Suppliers
        </Button>
      </div>

      {!isVerified && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-card flex items-center gap-2 text-warning text-xs">
          <AlertTriangle size={16} className="shrink-0" />
          <span>Caution: This supplier has unverified regulatory credentials. Proceed with care.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-panel-strong border border-border/30 rounded-card shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sora font-bold text-xl shrink-0">
            {supplier.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold font-sora text-text truncate">{supplier.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
              {supplier.phones[0] && (
                <span className="flex items-center gap-1 font-mono cursor-pointer hover:text-text" onClick={() => navigator.clipboard.writeText(supplier.phones[0])}>
                  <Phone size={12} /> {supplier.phones[0]}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1 font-mono cursor-pointer hover:text-text" onClick={() => navigator.clipboard.writeText(supplier.email || '')}>
                  <Mail size={12} /> {supplier.email}
                </span>
              )}
              <span className="flex items-center gap-1 font-medium">
                <MapPin size={12} /> {supplier.location.label}, {supplier.location.city}
              </span>
            </div>
            <VerificationBadges verification={supplier.verification} />
          </div>
        </div>

        <FollowButton isFollowed={isFollowed} onToggle={handleToggleFollow} />
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-border/30 pb-3 shrink-0 overflow-x-auto custom-scrollbar">
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-input text-xs font-bold transition-all
                ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-panel-strong text-text-muted hover:text-text hover:bg-panel-strong/80'
                }
              `}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-border/40 text-text-muted'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
        {activeTab === 'products' && (
          <ProductsTab
            products={catalog}
            onAddToCart={handleAddToCart}
            onSeeAlternatives={() => {}}
          />
        )}
        {activeTab === 'cart' && (
          <CartTab
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveLine={handleRemoveLine}
            onSendOrder={handleSendOrder}
          />
        )}
        {activeTab === 'deals' && (
          <DealsTab
            orders={ordersForThisSupplier}
            onSelectOrder={onSelectOrder}
          />
        )}
      </div>

      {/* Read-only blocks below */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/30 shrink-0">
        <SupplierAvailability availability={supplier.availability} />
        <SupplierServices services={supplier.services} flags={supplier.flags} />
      </div>
    </div>
  );
};
