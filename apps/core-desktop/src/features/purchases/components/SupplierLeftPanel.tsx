// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { SearchableListPanel } from '@40labs/ui-components';
import { Supplier } from '@40labs/types';
import { SupplierListItem } from './SupplierListItem';

export interface SupplierLeftPanelProps {
  suppliers: Supplier[];
  selectedSupplierId: string | null;
  onSelectSupplier: (id: string) => void;
  onSearchChange: (q: string) => void;
}

export const SupplierLeftPanel: React.FC<SupplierLeftPanelProps> = ({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  onSearchChange,
}) => {
  return (
    <SearchableListPanel
      panelTitle="Suppliers Directory"
      searchPlaceholder="Search supplier or location..."
      onSearch={onSearchChange}
    >
      {suppliers.length === 0 ? (
        <div className="p-4 text-center text-xs text-text-muted italic">
          No suppliers found.
        </div>
      ) : (
        suppliers.map((supplier) => (
          <SupplierListItem
            key={supplier.businessId}
            supplier={{
              ...supplier,
              id: supplier.businessId,
              region: supplier.location.region,
              business: {
                name: supplier.name,
                address: { region: supplier.location.region, district: supplier.location.city, place: supplier.location.label },
              },
            }}
            isSelected={supplier.businessId === selectedSupplierId}
            onClick={() => onSelectSupplier(supplier.businessId)}
          />
        ))
      )}
    </SearchableListPanel>
  );
};
