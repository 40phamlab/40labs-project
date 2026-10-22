// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { Briefcase } from 'lucide-react';

export interface SupplierServicesProps {
  services: {
    id: string;
    title: string;
    blurb: string;
  }[];
  flags: {
    ePharmacy: boolean;
    education: boolean;
    delivery: boolean;
  };
}

export const SupplierServices: React.FC<SupplierServicesProps> = ({ services, flags }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-1 rounded text-[10px] font-bold ${flags.delivery ? 'bg-success/20 text-success' : 'bg-panel-strong text-text-muted'}`}>
          {flags.delivery ? '✓ Delivery Available' : 'No Direct Delivery'}
        </span>
        <span className={`px-2 py-1 rounded text-[10px] font-bold ${flags.ePharmacy ? 'bg-primary/20 text-primary' : 'bg-panel-strong text-text-muted'}`}>
          {flags.ePharmacy ? '✓ ePharmacy Enabled' : 'Standard Supply'}
        </span>
        <span className={`px-2 py-1 rounded text-[10px] font-bold ${flags.education ? 'bg-accent/20 text-accent' : 'bg-panel-strong text-text-muted'}`}>
          {flags.education ? '✓ Educational Partner' : 'Wholesale Only'}
        </span>
      </div>

      {services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((srv) => (
            <div key={srv.id} className="p-3 bg-panel-strong border border-border/30 rounded-card space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Briefcase size={14} className="text-primary" />
                <span>{srv.title}</span>
              </div>
              <p className="text-[11px] text-text-muted">{srv.blurb}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-text-muted italic">TODO: wire to cloud profile [V2]</p>
    </div>
  );
};
