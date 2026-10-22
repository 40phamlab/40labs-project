// [PHASE: marketplace-preview — Marketplace search]
import * as React from 'react';
import { Search, Store, Pill } from 'lucide-react';
import { Input, Button, Modal } from '@40labs/ui-components';
import { CatalogProduct } from '@40labs/types';
import { useMarketplaceSearch, SearchFilterType } from '../hooks/useMarketplaceSearch';
import { SupplierResultRow } from './SupplierResultRow';
import { ProductResultRow } from './ProductResultRow';
import { SupplierCard } from './SupplierCard';

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-accent/20 text-text font-bold px-0.5 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export interface SearchPanelProps {
  onSelectSupplier: (supplierId: string) => void;
  onSelectProductAndSupplier?: (supplierId: string, productId: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSelectSupplier,
}) => {
  const {
    query,
    setQuery,
    filter,
    setFilter,
    suppliers,
    products,
    followedSuppliers,
    recommendedSuppliers,
    isLoading,
    isOnline,
    lastSyncedAt,
    alternativesModalProduct,
    setAlternativesModalProduct,
    alternativesList,
    isLoadingAlternatives,
    loadAlternatives,
  } = useMarketplaceSearch();

  const filters: { id: SearchFilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'products', label: 'Products' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'followed', label: 'Followed' },
  ];

  const isEmpty = !query.trim();
  const hasNoResults = !isEmpty && suppliers.length === 0 && products.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-panel rounded-card border border-border/50 elevation-raised overflow-hidden">
      {/* Search Input and Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or supplier..."
            className="pl-9 font-sora text-xs rounded-input"
          />
        </div>

        <div className="flex items-center gap-1 bg-panel-strong p-1 rounded-input border border-border/30 shrink-0 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                px-2.5 py-1 rounded text-[11px] font-bold transition-all
                ${filter === f.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4">
        {isLoading && (
          <div className="text-center py-10 text-xs text-text-muted italic">Searching local cache...</div>
        )}

        {isEmpty && !isLoading && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Store size={14} /> Followed Stores
              </h3>
              {followedSuppliers.length === 0 ? (
                <p className="text-xs text-text-muted italic">No followed suppliers yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followedSuppliers.map((s) => (
                    <SupplierCard
                      key={s.businessId}
                      supplier={s}
                      onOpen={() => onSelectSupplier(s.businessId)}
                      onUnfollow={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Pill size={14} /> Recommended Suppliers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedSuppliers.map((s) => (
                  <SupplierCard
                    key={s.businessId}
                    supplier={s}
                    onOpen={() => onSelectSupplier(s.businessId)}
                    onUnfollow={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!isEmpty && hasNoResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted gap-3">
            <p className="text-xs italic">No matching suppliers or products found.</p>
            {isOnline ? (
              <Button size="sm" intent="secondary">Search all suppliers online</Button>
            ) : (
              <p className="text-[10px] text-text-muted">
                Offline mode: results are from last sync ({new Date(lastSyncedAt).toLocaleString()}).
              </p>
            )}
          </div>
        )}

        {!isEmpty && !hasNoResults && !isLoading && (
          <div className="space-y-4">
            {suppliers.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Suppliers</h4>
                <div className="space-y-2">
                  {suppliers.map((s) => (
                    <SupplierResultRow
                      key={s.businessId}
                      supplier={s}
                      query={query}
                      onClick={() => onSelectSupplier(s.businessId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Products</h4>
                <div className="space-y-2">
                  {products.map((p) => (
                    <ProductResultRow
                      key={p.id}
                      product={p}
                      query={query}
                      onClick={() => onSelectSupplier(p.supplierBusinessId)}
                      onSeeAlternatives={loadAlternatives}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alternatives Modal */}
      <Modal
        isOpen={!!alternativesModalProduct}
        onClose={() => setAlternativesModalProduct(null)}
        title={`Alternatives for ${alternativesModalProduct?.name || 'Product'}`}
      >
        <div className="flex flex-col gap-3 p-2 text-xs">
          {isLoadingAlternatives ? (
            <p className="text-center py-6 text-text-muted italic">Finding best alternatives...</p>
          ) : alternativesList.length === 0 ? (
            <p className="text-center py-6 text-text-muted italic">No alternative suppliers available for this medicine.</p>
          ) : (
            <div className="space-y-2">
              {alternativesList.map((alt) => (
                <div key={alt.id} className="p-3 bg-panel-strong rounded-card flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-text">{alt.name}</p>
                    <span className="text-[10px] font-mono text-text-muted">Supplier: {alt.supplierBusinessId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">TZS {alt.unitPriceTzs.toLocaleString()}</span>
                    <Button
                      size="sm"
                      intent="primary"
                      onClick={() => {
                        setAlternativesModalProduct(null);
                        onSelectSupplier(alt.supplierBusinessId);
                      }}
                    >
                      View Store
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
