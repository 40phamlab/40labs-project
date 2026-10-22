// [PHASE: marketplace-preview]
import * as React from 'react';
import { CompactProductRow } from './CompactProductRow';
import { StorefrontProduct } from './SupplierStorefront';

export interface SupplierProductsTabProps {
  products: StorefrontProduct[];
  onAddToCart: (productId: string) => void;
  onMoreInfo: (product: StorefrontProduct) => void;
}

export const SupplierProductsTab: React.FC<SupplierProductsTabProps> = ({
  products,
  onAddToCart,
  onMoreInfo,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1 overflow-y-auto custom-scrollbar">
      {products.map((product) => (
        <CompactProductRow
          key={product.id}
          product={product}
          onAdd={onAddToCart}
          onMoreInfo={() => onMoreInfo(product)}
        />
      ))}
    </div>
  );
};
