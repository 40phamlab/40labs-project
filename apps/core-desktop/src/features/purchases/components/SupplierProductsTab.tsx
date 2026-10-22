// [PHASE: marketplace-preview — Storefront scroll + space]
import * as React from 'react';
import { CatalogProduct, SupplierCart } from '@40labs/types';
import { ProductCard } from '../../../shared/commerce';
import { Pill } from 'lucide-react';
import { ProductDrawer } from './ProductDrawer';
import { AlternativesSheet } from './AlternativesSheet';
import { templateCatalogRepo } from '../data/templateRepos';
import { normalizeToE164 } from '../data/channels/phone';

export interface SupplierProductsTabProps {
  products: CatalogProduct[];
  cart: SupplierCart;
  search: string;
  selectedCategory: string;
  sortBy: 'name' | 'price-asc' | 'price-desc';
  viewMode: 'grid' | 'list';
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  supplierPhone?: string;
  supplierName?: string;
  followedSupplierIds: string[];
  onNavigateToSupplier: (supplierBusinessId: string) => void;
}

export const SupplierProductsTab: React.FC<SupplierProductsTabProps> = ({
  products,
  cart,
  search,
  selectedCategory,
  sortBy,
  viewMode,
  onAddToCart,
  onUpdateQty,
  supplierPhone,
  supplierName = 'Supplier',
  followedSupplierIds,
  onNavigateToSupplier,
}) => {
  const [drawerProduct, setDrawerProduct] = React.useState<CatalogProduct | null>(null);
  const [alternativesProduct, setAlternativesProduct] = React.useState<CatalogProduct | null>(null);
  const [alternativesList, setAlternativesList] = React.useState<CatalogProduct[]>([]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4' : 'space-y-2'}>
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-text-muted gap-2">
            <Pill size={36} className="opacity-30" />
            <p className="text-xs italic">No products found matching your filter. / Hakuna bidhaa zilizopatikana.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
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
          })
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
