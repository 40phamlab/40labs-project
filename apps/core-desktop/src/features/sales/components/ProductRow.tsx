import * as React from 'react';
import { ProductCard } from '../../../shared/commerce';

export interface ProductRowProps {
  name: string;
  sku?: string;
  stock: number;
  price: number;
  onAdd?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  name,
  sku,
  stock,
  price,
  onAdd,
  disabled = false,
  className = '',
}) => {
  return (
    <ProductCard
      id={sku || name}
      name={name}
      subtitle={sku}
      unitPrice={price}
      stock={stock}
      mode="sale"
      viewMode="list"
      disabled={disabled}
      onAddToCart={onAdd}
      className={className}
    />
  );
};
