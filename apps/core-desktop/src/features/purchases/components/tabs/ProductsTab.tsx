// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { Input } from '@40labs/ui-components';
import { Search } from 'lucide-react';
import { ProductResultRow } from '../ProductResultRow';

export interface ProductsTabProps {
  products: CatalogProduct[];
  onAddToCart: (product: CatalogProduct) => void;
  onSeeAlternatives: (product: CatalogProduct) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  onAddToCart,
  onSeeAlternatives,
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.form));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.form !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q)
      );
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products in this store..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-panel-strong p-1 rounded-input border border-border/30 shrink-0 overflow-x-auto">
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-xs text-text-muted italic">No products found matching your filter.</div>
        ) : (
          filteredProducts.map((p) => (
            <ProductResultRow
              key={p.id}
              product={p}
              query={search}
              onClick={() => onAddToCart(p)}
              onSeeAlternatives={onSeeAlternatives}
            />
          ))
        )}
      </div>
    </div>
  );
};
