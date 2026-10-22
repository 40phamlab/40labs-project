// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { ProductCard as SharedProductCard } from '../../../shared/commerce';
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
  const handleChat = () => {
    const rawPhone = supplierPhone || '+255700000000';
    const e164 = normalizeToE164(rawPhone);
    const phoneClean = e164 ? e164.replace('+', '') : '255700000000';
    const msg = encodeURIComponent(
      `Hello ${supplierName}, I am inquiring about product: ${product.name} (${product.packSize}), quantity: ${cartQty || 1}. Buyer ID: AFYA-MYPHARMACY.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${msg}`, '_blank');
  };

  return (
    <SharedProductCard
      id={product.id}
      name={product.name}
      subtitle={`${product.genericName} • ${product.form}`}
      unitPrice={product.unitPriceTzs}
      oldUnitPrice={product.oldUnitPriceTzs}
      stock={product.stock}
      unitType={product.packSize}
      mode="purchase"
      cartQty={cartQty}
      onAddToCart={() => onAddToCart(product, 1)}
      onUpdateQty={(qty) => onUpdateQty(product.id, qty)}
      onMoreAbout={() => onMoreAbout(product)}
      onSeeAlternatives={() => onSeeAlternatives(product)}
      onChat={handleChat}
    />
  );
};
