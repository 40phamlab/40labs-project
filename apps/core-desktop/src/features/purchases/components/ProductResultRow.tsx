// [PHASE: marketplace-preview — Marketplace search]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { StatusBadge, Button } from '@40labs/ui-components';
import { Pill } from 'lucide-react';
import { HighlightMatch } from './SearchPanel';

export interface ProductResultRowProps {
  product: CatalogProduct & { supplierName?: string };
  query: string;
  onClick: () => void;
  onSeeAlternatives: (product: CatalogProduct) => void;
}

export const ProductResultRow: React.FC<ProductResultRowProps> = ({
  product,
  query,
  onClick,
  onSeeAlternatives,
}) => {
  const isOut = product.stock === 'out';
  const priceFormatted = `TZS ${product.unitPriceTzs.toLocaleString()}`;

  let stockStatus: 'success' | 'warning' | 'error' = 'success';
  if (product.stock === 'low') stockStatus = 'warning';
  else if (product.stock === 'out') stockStatus = 'error';

  return (
    <div className="p-3 bg-panel border border-border/30 rounded-card flex items-center justify-between gap-3 hover:bg-panel-strong/60 transition-all">
      <div onClick={onClick} className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Pill size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-text truncate">
            <HighlightMatch text={product.name} query={query} />
          </h4>
          <p className="text-xs text-text-muted truncate">
            <HighlightMatch text={product.genericName} query={query} /> • {product.supplierName || product.supplierBusinessId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono font-bold text-text text-xs">{priceFormatted}</span>
        <StatusBadge status={stockStatus} label={product.stock.toUpperCase()} />
        {isOut ? (
          <Button
            size="sm"
            intent="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onSeeAlternatives(product);
            }}
          >
            See Alternatives
          </Button>
        ) : (
          <Button
            size="sm"
            intent="primary"
            onClick={onClick}
          >
            View
          </Button>
        )}
      </div>
    </div>
  );
};
