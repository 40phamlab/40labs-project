// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { CatalogProduct } from '@40labs/types';
import { Modal, Button, StatusBadge } from '@40labs/ui-components';
import { StockChip } from './StockChip';

export interface AlternativesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  alternatives: CatalogProduct[];
  followedSupplierIds: string[];
  onSelectAlternative: (alt: CatalogProduct) => void;
}

export const AlternativesSheet: React.FC<AlternativesSheetProps> = ({
  isOpen,
  onClose,
  productName,
  alternatives,
  followedSupplierIds,
  onSelectAlternative,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Alternatives for ${productName}`} size="lg">
      <div className="flex flex-col gap-3 p-2 text-xs">
        {alternatives.length === 0 ? (
          <p className="text-center py-8 text-text-muted italic">No alternative suppliers found for this medicine.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {alternatives.map((alt) => {
              const isFollowed = followedSupplierIds.includes(alt.supplierBusinessId);
              const priceFormatted = `TZS ${alt.unitPriceTzs.toLocaleString()} /${alt.packSize || 'pack'}`;
              return (
                <div key={alt.id} className="p-3 bg-panel-strong border border-border/30 rounded-card flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text">{alt.name}</h4>
                      {isFollowed && <StatusBadge status="success" label="Followed" />}
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">Supplier: {alt.supplierBusinessId}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary text-xs">{priceFormatted}</span>
                    <StockChip stock={alt.stock} />
                    <Button
                      size="sm"
                      intent="primary"
                      onClick={() => {
                        onSelectAlternative(alt);
                        onClose();
                      }}
                    >
                      Select Store
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
