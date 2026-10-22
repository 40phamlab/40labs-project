// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { Supplier } from '@40labs/types';
import { StatusBadge, Button } from '@40labs/ui-components';
import { MapPin, Store } from 'lucide-react';

export interface SupplierCardProps {
  supplier: Supplier;
  onOpen: (supplierId: string) => void;
  onUnfollow: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onOpen,
  onUnfollow,
}) => {
  return (
    <div className="p-4 bg-panel border border-border/40 rounded-card flex flex-col justify-between gap-3 elevation-raised hover:border-primary/40 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold font-sora">
          {supplier.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-text truncate" title={supplier.name}>
            {supplier.name}
          </h3>
          <span className="text-[10px] font-mono text-text-muted">{supplier.businessId}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {supplier.verification.tmda && <StatusBadge status="success" label="TMDA" />}
        {supplier.verification.tra && <StatusBadge status="success" label="TRA" />}
        {supplier.verification.verified40Labs && <StatusBadge status="success" label="40Labs" />}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20 text-xs text-text-muted">
        <div className="flex items-center gap-1 font-medium truncate">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{supplier.location.city}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" intent="ghost" onClick={() => onUnfollow(supplier.businessId)}>
            Unfollow
          </Button>
          <Button
            size="sm"
            intent="primary"
            leftIcon={<Store size={14} />}
            onClick={() => onOpen(supplier.businessId)}
          >
            Open
          </Button>
        </div>
      </div>
    </div>
  );
};
