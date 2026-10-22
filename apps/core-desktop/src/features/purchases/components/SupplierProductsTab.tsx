// [PHASE: marketplace-preview — Product catalog UI v2]
import * as React from 'react';
import { CatalogProduct, SupplierCart } from '@40labs/types';
import { ProductCard } from '../../../shared/commerce';
import { Input } from '@40labs/ui-components';
import { Search, LayoutGrid, List, Pill } from 'lucide-react';
import { ProductDrawer } from './ProductDrawer';
import { AlternativesSheet } from './AlternativesSheet';
import { templateCatalogRepo } from '../data/templateRepos';
import { normalizeToE164 } from '../data/channels/phone';

export interface SupplierProductsTabProps {
  products: CatalogProduct[];
  cart: SupplierCart;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  supplierPhone?: string;
  supplierName?: string;
  followedSupplierIds: string[];
  onNavigateToSupplier: (supplierBusinessId: string) => void;
}

const STORAGE_KEY_VIEW_MODE = '40labs_purchases_view_mode';

export const SupplierProductsTab: React.FC<SupplierProductsTabProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQty,
  supplierPhone,
  supplierName = 'Supplier',
  followedSupplierIds,
  onNavigateToSupplier,
}) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    return saved === 'list' ? 'list' : 'grid';
  });

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, mode);
  };

  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'price-asc' | 'price-desc'>('name');

  const [drawerProduct, setDrawerProduct] = React.useState<CatalogProduct | null>(null);
  const [alternativesProduct, setAlternativesProduct] = React.useState<CatalogProduct | null>(null);
  const [alternativesList, setAlternativesList] = React.useState<CatalogProduct[]>([]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.form) set.add(p.form);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = products.filter((p) => {
      if (selectedCategory !== 'all' && p.form?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.genericName?.toLowerCase().includes(q) ||
        p.form?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return a.unitPriceTzs - b.unitPriceTzs;
      if (sortBy === 'price-desc') return b.unitPriceTzs - a.unitPriceTzs;
      return 0;
    });

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const handleOpenAlternatives = async (product: CatalogProduct) => {
    setAlternativesProduct(product);
    const alts = await templateCatalogRepo.findAlternatives(product.medicineKey, product.supplierBusinessId);
    setAlternativesList(alts);
  };

  const handleChat = (product: CatalogProduct, qty: number) => {
    const rawPhone = supplierPhone || '+255700000000';
    const e164 = normalizeToE164(rawPhone);
    const phoneClean = e164 ? e164.replace('+', '') : '255700000000';
    const msg = encodeURIComponent(
      `Hello ${supplierName}, I am inquiring about product: ${product.name} (${product.packSize}), quantity: ${qty || 1}. Buyer ID: AFYA-MYPHARMACY.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${msg}`, '_blank');
  };

  // Virtualization for > 50 items
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const isVirtualized = filteredProducts.length > 50;
  const itemHeight = viewMode === 'grid' ? 320 : 80;
  const containerHeight = 600;

  const visibleRange = React.useMemo(() => {
    if (!isVirtualized) return { start: 0, end: filteredProducts.length };
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const end = Math.min(filteredProducts.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 5);
    return { start, end };
  }, [isVirtualized, scrollTop, filteredProducts.length, itemHeight]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between bg-panel-strong/30 p-2.5 rounded-card border border-border/30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products in this store..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-panel p-1 rounded-input border border-border/30 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-2.5 py-1 rounded text-[11px] font-bold capitalize transition-all
                  ${selectedCategory === cat ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-panel border border-border/30 rounded-input text-text font-medium"
          >
            <option value="name">Name (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <div className="flex items-center bg-panel rounded-input border border-border/30 p-0.5 shrink-0">
            <button
              onClick={() => toggleViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => toggleViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}`}
              title="Compact list view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1 relative"
      >
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-2">
            <Pill size={36} className="opacity-30" />
            <p className="text-xs italic">No products found matching your filter.</p>
          </div>
        ) : isVirtualized ? (
          <div
            style={{
              height: `${filteredProducts.length * itemHeight}px`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${visibleRange.start * itemHeight}px`,
                left: 0,
                right: 0,
              }}
              className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4' : 'space-y-2'}
            >
              {filteredProducts.slice(visibleRange.start, visibleRange.end).map((p) => {
                const cartLine = cart.lines.find((l) => l.productId === p.id);
                const qty = cartLine?.qty || 0;
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    genericName={p.genericName}
                    form={p.form}
                    controlled={p.controlled}
                    imageUrl={p.imageUrl}
                    unitPrice={p.unitPriceTzs}
                    oldUnitPrice={p.oldUnitPriceTzs}
                    stock={p.stock}
                    unitType={p.packSize}
                    mode="purchase"
                    cartQty={qty}
                    viewMode={viewMode}
                    onAddToCart={() => onAddToCart(p, 1)}
                    onUpdateQty={(newQty) => onUpdateQty(p.id, newQty)}
                    onDetails={() => setDrawerProduct(p)}
                    onSeeAlternatives={() => handleOpenAlternatives(p)}
                    onChat={() => handleChat(p, qty || 1)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4' : 'space-y-2'}>
            {filteredProducts.map((p) => {
              const cartLine = cart.lines.find((l) => l.productId === p.id);
              const qty = cartLine?.qty || 0;
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  genericName={p.genericName}
                  form={p.form}
                  controlled={p.controlled}
                  imageUrl={p.imageUrl}
                  unitPrice={p.unitPriceTzs}
                  oldUnitPrice={p.oldUnitPriceTzs}
                  stock={p.stock}
                  unitType={p.packSize}
                  mode="purchase"
                  cartQty={qty}
                  viewMode={viewMode}
                  onAddToCart={() => onAddToCart(p, 1)}
                  onUpdateQty={(newQty) => onUpdateQty(p.id, newQty)}
                  onDetails={() => setDrawerProduct(p)}
                  onSeeAlternatives={() => handleOpenAlternatives(p)}
                  onChat={() => handleChat(p, qty || 1)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ProductDrawer
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
        product={drawerProduct}
        cartQty={drawerProduct ? cart.lines.find((l) => l.productId === drawerProduct.id)?.qty || 0 : 0}
        onAddToCart={(prod, q) => onAddToCart(prod, q)}
        onUpdateQty={onUpdateQty}
        supplierPhone={supplierPhone}
        supplierName={supplierName}
      />

      <AlternativesSheet
        isOpen={!!alternativesProduct}
        onClose={() => setAlternativesProduct(null)}
        productName={alternativesProduct?.name || ''}
        alternatives={alternativesList}
        followedSupplierIds={followedSupplierIds}
        onSelectAlternative={(alt) => {
          onNavigateToSupplier(alt.supplierBusinessId);
          setAlternativesProduct(null);
        }}
      />
    </div>
  );
};
