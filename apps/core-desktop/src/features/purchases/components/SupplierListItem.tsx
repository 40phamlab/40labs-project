import * as React from 'react';
import { StatusBadge } from '@40labs/ui-components';
import { MapPin, ChevronRight, Building2 } from 'lucide-react';
import type { Supplier, Business } from '@40labs/types';

export interface ExtendedSupplier extends Supplier {
  name?: string;
  region?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  business?: Partial<Business>;
}

export interface SupplierListItemProps {
  supplier: ExtendedSupplier;
  isSelected?: boolean;
  onClick?: (id?: string) => void;
  className?: string;
}

export const SupplierListItem: React.FC<SupplierListItemProps> = ({
  supplier,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const name = supplier.business?.name || supplier.name || 'Unnamed Supplier';
  const region = supplier.business?.address?.region || supplier.region;

  const handleClick = () => {
    if (onClick) {
      onClick(supplier.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-3 rounded-card border transition-all cursor-pointer flex flex-col gap-2
        ${
          isSelected
            ? 'bg-panel-strong border-primary/50 elevation-raised'
            : 'bg-panel border-border/30 hover:bg-panel-strong/40 hover:border-border/60'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-text truncate">{name}</h4>
            {supplier.business_id && (
              <span className="text-[10px] font-mono text-text-muted">{supplier.business_id}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-text-muted shrink-0" />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/10">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {supplier.tmda_verified && (
            <StatusBadge status="success" label="TMDA" />
          )}
          {supplier.tra_verified && (
            <StatusBadge status="success" label="TRA" />
          )}
        </div>

        {region && (
          <div className="flex items-center gap-1 text-[10px] text-text-muted shrink-0 font-medium">
            <MapPin size={10} />
            <span>{region}</span>
          </div>
        )}
      </div>
    </div>
  );
};
