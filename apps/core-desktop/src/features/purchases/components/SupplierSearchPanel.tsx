import * as React from 'react';
import { SearchableListPanel, IconButton } from '@40labs/ui-components';
import { ChevronRight } from 'lucide-react';
import { SupplierListItem, ExtendedSupplier } from './SupplierListItem';
import { usePurchases } from '../../../hooks/usePurchases';

export interface SupplierSearchPanelProps {
  suppliers?: ExtendedSupplier[];
  selectedSupplierId?: string | null;
  onSelectSupplier: (id: string) => void;
  onToggleCollapse?: () => void;
  className?: string;
}

export const SupplierSearchPanel: React.FC<SupplierSearchPanelProps> = ({
  suppliers: suppliersProp,
  selectedSupplierId,
  onSelectSupplier,
  onToggleCollapse,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { suppliers: fetchedSuppliers } = usePurchases();

  const suppliers = React.useMemo(() => {
    if (suppliersProp) return suppliersProp;
    const baseSuppliers = fetchedSuppliers;
    return baseSuppliers.map((s) => ({
      ...s,
      name: s.id === 'supplier_001' ? 'Kibo Pharma Distributors' : 'Bora Medical Supplies',
      region: s.id === 'supplier_001' ? 'Dar es Salaam' : 'Arusha',
      business: {
        name: s.id === 'supplier_001' ? 'Kibo Pharma Distributors' : 'Bora Medical Supplies',
        address: {
          region: s.id === 'supplier_001' ? 'Dar es Salaam' : 'Arusha',
          district: 'Kinondoni',
          place: 'Kijitonyama',
        },
      },
    })) as ExtendedSupplier[];
  }, [suppliersProp, fetchedSuppliers]);

  const filteredSuppliers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const name = s.business?.name || s.name || '';
      const region = s.business?.address?.region || s.region || '';
      return (
        name.toLowerCase().includes(q) ||
        (s.business_id || '').toLowerCase().includes(q) ||
        region.toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {onToggleCollapse && (
        <div className="absolute right-3 top-3 z-10">
          <IconButton
            icon={<ChevronRight size={16} />}
            label="Close supplier panel"
            intent="neutral"
            size="sm"
            className="shadow-surface-pop border border-border/50"
            onClick={onToggleCollapse}
          />
        </div>
      )}

      <SearchableListPanel
        panelTitle="Suppliers Directory"
        searchPlaceholder="Search supplier or location..."
        onSearch={setSearchQuery}
      >
        {filteredSuppliers.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted italic">
            No suppliers match "{searchQuery}"
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <SupplierListItem
              key={supplier.id}
              supplier={supplier}
              isSelected={supplier.id === selectedSupplierId}
              onClick={() => onSelectSupplier(supplier.id)}
            />
          ))
        )}
      </SearchableListPanel>
    </div>
  );
};
