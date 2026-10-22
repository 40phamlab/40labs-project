// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { CatalogProduct, SupplierCart } from '@40labs/types';
import { ProductCard } from './ProductCard';
import { Pill } from 'lucide-react';

export interface ProductGridProps {
  products: CatalogProduct[];
  cart: SupplierCart;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onMoreAbout: (product: CatalogProduct) => void;
  onSeeAlternatives: (product: CatalogProduct) => void;
  supplierPhone?: string;
  supplierName?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQty,
  onMoreAbout,
  onSeeAlternatives,
  supplierPhone,
  supplierName,
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-2">
        <Pill size={36} className="opacity-30" />
        <p className="text-xs italic">No products available in this catalog.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-1">
      {products.map((p) => {
        const cartLine = cart.lines.find((l) => l.productId === p.id);
        const qty = cartLine?.qty || 0;
        return (
          <ProductCard
            key={p.id}
            product={p}
            cartQty={qty}
            onAddToCart={onAddToCart}
            onUpdateQty={onUpdateQty}
            onMoreAbout={onMoreAbout}
            onSeeAlternatives={onSeeAlternatives}
            supplierPhone={supplierPhone}
            supplierName={supplierName}
          />
        );
      })}
    </div>
  );
};
