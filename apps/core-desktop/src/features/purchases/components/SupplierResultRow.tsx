// [PHASE: marketplace-preview — Marketplace search]
import * as React from 'react';
import { Supplier } from '@40labs/types';
import { StatusBadge } from '@40labs/ui-components';
import { Building2, MapPin, ChevronRight } from 'lucide-react';
import { HighlightMatch } from './SearchPanel';

export interface SupplierResultRowProps {
  supplier: Supplier;
  query: string;
  onClick: () => void;
}

export const SupplierResultRow: React.FC<SupplierResultRowProps> = ({
  supplier,
  query,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-panel border border-border/30 rounded-card flex items-center justify-between gap-3 cursor-pointer hover:bg-panel-strong/60 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-text truncate">
            <HighlightMatch text={supplier.name} query={query} />
          </h4>
          <span className="text-[10px] font-mono text-text-muted">{supplier.businessId}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          {supplier.verification.tmda && <StatusBadge status="success" label="TMDA" />}
          {supplier.verification.tra && <StatusBadge status="success" label="TRA" />}
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <MapPin size={12} />
          <span><HighlightMatch text={supplier.location.city} query={query} /></span>
        </div>
        <ChevronRight size={16} className="text-text-muted" />
      </div>
    </div>
  );
};
