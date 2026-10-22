// [PHASE: marketplace-preview — Storefront scroll + space]
import * as React from 'react';
import { TabbedListContainer } from '@40labs/ui-components';
import { CheckCircle2, Search, LayoutGrid, List, Filter } from 'lucide-react';
import type { MarketplaceSupplier, CatalogProduct } from '@40labs/types';
import { SupplierStorefrontHeader } from './SupplierStorefrontHeader';
import { SupplierProductsTab } from './SupplierProductsTab';
import { CartTab } from './tabs/CartTab';
import { useSendOrder } from '../hooks/useSendOrder';
import { SupplierDealsTab, SupplierDealEntry } from './SupplierDealsTab';
import { useCatalogQuery, useCartQuery, useOrdersQuery, useMarketplaceMutations, useFollowedSuppliersQuery } from '../hooks/usePurchasesMarketplace';
import { WhatsAppChannel } from '../data/channels/WhatsAppChannel';
import { Button, Popover } from '@40labs/ui-components';
import { FollowButton } from './FollowButton';

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

  const supplierDeals = React.memo(() => {
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
  })();

  const subtotal = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
  const totalCartCount = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  const tabs = [
    { id: 'products', label: 'Products', count: catalog.length },
    { id: 'cart', label: 'Cart', count: totalCartCount },
    { id: 'deals', label: 'Deals', count: supplierDeals.length },
  ];

  // Header scroll detection via IntersectionObserver
  const headerRef = React.useRef<HTMLDivElement>(null);
  const stickyBarRef = React.useRef<HTMLDivElement>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = React.useState(false);

  React.useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(headerEl);
    return () => observer.disconnect();
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (stickyBarRef.current) {
      const parentScroller = stickyBarRef.current.closest('.overflow-y-auto');
      if (parentScroller) {
        const topOffset = (stickyBarRef.current as HTMLElement).offsetTop;
        parentScroller.scrollTo({ top: topOffset, behavior: 'smooth' });
      }
    }
  };

  // State for products tab search/filters inside sticky bar / popover
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('40labs_purchases_view_mode');
    return saved === 'list' ? 'list' : 'grid';
  });

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('40labs_purchases_view_mode', mode);
  };

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((p) => {
      if (p.form) set.add(p.form);
    });
    return ['all', ...Array.from(set)];
  }, [catalog]);

  const initials = supplier.name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-4 bg-panel p-5 rounded-card border border-border/50 elevation-raised min-h-full pb-6">
      {/* Scroll-away area: Breadcrumb + Header */}
      <div ref={headerRef} className="flex flex-col gap-4">
        <SupplierStorefrontHeader
          supplier={supplier}
          isFollowed={isFollowed}
          onToggleFollow={handleToggleFollow}
          onViewProfile={() => onNavigate(`#purchases/supplier/${supplier.businessId}/profile`)}
          onNavigate={onNavigate}
        />
      </div>

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

      {/* Sticky Slim Bar */}
      <div
        ref={stickyBarRef}
        className={`sticky top-0 z-30 transition-all duration-200 bg-[#F8FAFB] dark:bg-panel border-b ${
          isHeaderScrolled ? 'border-border/60 shadow-md py-2 px-3' : 'border-transparent py-1 px-1'
        } flex items-center justify-between gap-3 min-h-[56px] rounded-card`}
      >
        {/* Compact identity block (only when header scrolled, >=1200px container width) */}
        <div
          className={`hidden min-[1200px]:flex items-center gap-2.5 transition-all duration-150 ease-out motion-reduce:transition-none shrink-0 ${
            isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sora font-bold text-xs shrink-0 shadow-inner">
            {initials}
          </div>
          <span className="text-xs font-bold text-text truncate max-w-[140px]" title={supplier.name}>
            {supplier.name}
          </span>
          <FollowButton isFollowed={isFollowed} onToggle={handleToggleFollow} />
        </div>

        {/* Tabs: Products / Cart / Deals with count pills */}
        <div className="flex items-center gap-1 bg-panel-strong p-1 rounded-input border border-border/30 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-panel border border-border/30 text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input (flex-1 when products tab) */}
        {activeTab === 'products' && (
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products in this store... / Tafuta bidhaa..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-panel border border-border/30 rounded-input text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {/* Grid/List toggle + Filters Popover */}
        {activeTab === 'products' && (
          <div className="flex items-center gap-2 shrink-0">
            <Popover
              isOpen={false}
              onClose={() => {}}
              position="bottom-end"
              title="Filter Products / Chuja Bidhaa"
              content={
                <div className="flex flex-col gap-3 w-64 p-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Category / Jamii</span>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2 py-1 rounded text-[11px] font-bold capitalize ${
                            selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-panel-subtle text-text-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-border/30">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Sort / Panga</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full p-1.5 text-xs bg-panel-subtle border border-border/30 rounded text-text"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              }
            >
              <Button size="sm" intent="secondary" leftIcon={<Filter size={14} />}>
                Filters {selectedCategory !== 'all' ? '(1)' : ''}
              </Button>
            </Popover>

            <div className="flex items-center bg-panel rounded-input border border-border/30 p-0.5">
              <button
                onClick={() => toggleViewMode('grid')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => toggleViewMode('list')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'products' && (
          <SupplierProductsTab
            products={catalog}
            cart={cart}
            search={search}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            viewMode={viewMode}
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
            onSwitchTab={handleTabChange}
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
              handleTabChange('cart');
            }}
            onCommunicate={() => {}}
            onMoreInfo={() => {}}
          />
        )}
      </div>
    </div>
  );
};

