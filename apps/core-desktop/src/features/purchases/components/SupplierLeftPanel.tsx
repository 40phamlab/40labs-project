// [PHASE: marketplace-preview — Collapsed search rail polish]
import * as React from 'react';
import { SearchableListPanel } from '@40labs/ui-components';
import { Supplier } from '@40labs/types';
import { SupplierListItem } from './SupplierListItem';
import { Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface SupplierLeftPanelProps {
  suppliers: Supplier[];
  followedSuppliers?: Supplier[];
  selectedSupplierId: string | null;
  onSelectSupplier: (id: string) => void;
  onSearchChange: (q: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const SupplierLeftPanel: React.FC<SupplierLeftPanelProps> = ({
  suppliers,
  followedSuppliers = [],
  selectedSupplierId,
  onSelectSupplier,
  onSearchChange,
  isOpen,
  onToggleOpen,
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) {
    const quickSuppliers = followedSuppliers.slice(0, 6);
    return (
      <div
        className="w-14 h-full bg-panel rounded-card border border-border/50 elevation-raised flex flex-col items-center p-2 gap-3 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out motion-reduce:transition-none select-none"
        aria-label="Suppliers rail"
      >
        <button
          type="button"
          aria-expanded={false}
          aria-controls="supplier-search-panel"
          onClick={onToggleOpen}
          title="Show search / Onyesha utafutaji"
          className="w-9 h-9 rounded-lg bg-panel-strong border border-border/30 flex items-center justify-center text-text hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          <PanelLeftOpen size={18} />
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleOpen();
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          title="Search suppliers / Tafuta wasambazaji"
          className="w-9 h-9 rounded-lg bg-panel hover:bg-panel-strong border border-border/20 flex items-center justify-center text-text-muted hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          <Search size={18} />
        </button>

        <div className="w-8 h-px bg-border/40 my-1 shrink-0" />

        {/* Quick-open avatars of followed suppliers */}
        <div className="flex flex-col gap-2.5 items-center w-full overflow-y-auto custom-scrollbar p-0.5">
          {quickSuppliers.map((s) => {
            const initials = s.name.slice(0, 2).toUpperCase();
            const isSelected = s.businessId === selectedSupplierId;
            return (
              <button
                key={s.businessId}
                type="button"
                onClick={() => onSelectSupplier(s.businessId)}
                title={`${s.name} (${s.location.city})`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-sora transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-panel'
                    : 'bg-panel-strong text-text hover:bg-primary/20 border border-border/30'
                }`}
              >
                {initials}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      id="supplier-search-panel"
      className="w-[280px] lg:w-[320px] h-full flex flex-col bg-panel rounded-card border border-border/50 elevation-raised shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out motion-reduce:transition-none relative p-2"
    >
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          aria-expanded={true}
          aria-controls="supplier-search-panel"
          onClick={onToggleOpen}
          title="Hide search / Ficha utafutaji"
          className="w-7 h-7 rounded-lg bg-panel-strong border border-border/30 flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <SearchableListPanel
        panelTitle="Suppliers Directory / Orodha"
        searchPlaceholder="Search supplier or location..."
        onSearch={onSearchChange}
      >
        {suppliers.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted italic">
            No suppliers found / Hakuna wasambazaji waliopatikana.
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
    </div>
  );
};
