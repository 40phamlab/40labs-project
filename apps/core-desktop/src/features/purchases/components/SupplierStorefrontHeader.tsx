// [PHASE: marketplace-preview — Storefront Header]
import * as React from 'react';
import { MarketplaceSupplier } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { VerificationBadges } from './VerificationBadges';
import { FollowButton } from './FollowButton';
import { calculateOpenNow } from '../utils/availability';

export interface SupplierStorefrontHeaderProps {
  supplier: MarketplaceSupplier;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onViewProfile: () => void;
  onNavigate: (route: string) => void;
}

export const SupplierStorefrontHeader: React.FC<SupplierStorefrontHeaderProps> = ({
  supplier,
  isFollowed,
  onToggleFollow,
  onViewProfile,
  onNavigate,
}) => {
  const openStatus = React.useMemo(() => calculateOpenNow(supplier.availability), [supplier.availability]);
  const initials = supplier.name.slice(0, 2).toUpperCase();

  const handleCopyBusinessId = () => {
    if (supplier.businessId) {
      navigator.clipboard.writeText(supplier.businessId);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('[40Labs Purchases] Missing businessId for supplier:', supplier);
    }
  };

  return (
    <div className="flex flex-col gap-4 shrink-0">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <button type="button" onClick={() => onNavigate('#purchases')} className="hover:text-primary transition-colors">
          Purchases
        </button>
        <ChevronRight size={14} className="opacity-60" />
        <span className="text-text font-bold truncate max-w-[250px]">{supplier.name}</span>
      </nav>

      {/* Header card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 bg-panel-strong border border-border/30 rounded-card shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sora font-bold text-xl shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold font-sora text-text truncate">{supplier.name}</h2>
              {supplier.businessId ? (
                <span
                  onClick={handleCopyBusinessId}
                  className="font-mono text-xs bg-panel px-2 py-0.5 rounded border border-border/30 cursor-pointer hover:bg-border/20 transition-colors text-text-muted select-all"
                  title="Click to copy Business ID"
                >
                  {supplier.businessId}
                </span>
              ) : (
                <span className="font-mono text-xs text-text-muted">"—"</span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  openStatus.isOpen ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20' : 'bg-danger/10 text-danger border border-danger/20'
                }`}
                title={openStatus.tooltip}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-[#16A34A]' : 'bg-danger'}`} />
                {openStatus.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {supplier.businessTypes?.map((bt) => (
                <span key={bt} className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {bt}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-0.5">
              {supplier.phones[0] && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} /> {supplier.phones[0]}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1 font-mono">
                  <Mail size={12} /> {supplier.email}
                </span>
              )}
              <span className="flex items-center gap-1 font-medium">
                <MapPin size={12} /> {supplier.location.label}, {supplier.location.city}
              </span>
            </div>

            <div className="pt-1">
              <VerificationBadges verification={supplier.verification} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button intent="secondary" size="sm" onClick={onViewProfile}>
            Profile
          </Button>
          <FollowButton isFollowed={isFollowed} onToggle={onToggleFollow} />
        </div>
      </div>
    </div>
  );
};
