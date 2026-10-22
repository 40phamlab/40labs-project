// [PHASE: marketplace-preview — Supplier Profile Page]
import * as React from 'react';
import { MarketplaceSupplier, CatalogProduct, PurchaseOrder } from '@40labs/types';
import { Button, StatusBadge } from '@40labs/ui-components';
import { ChevronRight, Phone, Mail, MapPin, CheckCircle, Clock } from 'lucide-react';
import { VerificationBadges } from './VerificationBadges';
import { FollowButton } from './FollowButton';
import { calculateOpenNow } from '../utils/availability';

export interface SupplierProfilePageProps {
  supplier: MarketplaceSupplier;
  catalog: CatalogProduct[];
  orders: PurchaseOrder[];
  isFollowed: boolean;
  onToggleFollow: () => void;
  onNavigate: (route: string) => void;
}

export const SupplierProfilePage: React.FC<SupplierProfilePageProps> = ({
  supplier,
  catalog,
  orders,
  isFollowed,
  onToggleFollow,
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

  const supplierOrders = orders.filter((o) => o.sellerBusinessId === supplier.businessId);
  const totalOrdersCount = supplierOrders.length;
  const totalTzsSum = supplierOrders.reduce((sum, o) => sum + o.totalTzs, 0);

  const featuredProducts = catalog.slice(0, 4);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const todayKey = new Date().toLocaleString('en-US', { weekday: 'short', timeZone: 'Africa/Dar_es_Salaam' }).toUpperCase().slice(0, 3);

  return (
    <div className="flex flex-col gap-5 h-full bg-panel p-6 rounded-card border border-border/50 elevation-raised overflow-y-auto custom-scrollbar">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-text-muted shrink-0">
        <button type="button" onClick={() => onNavigate('#purchases')} className="hover:text-primary transition-colors">
          Purchases
        </button>
        <ChevronRight size={14} className="opacity-60" />
        <button
          type="button"
          onClick={() => onNavigate(`#purchases/supplier/${supplier.businessId}`)}
          className="hover:text-primary transition-colors truncate max-w-[200px]"
        >
          {supplier.name}
        </button>
        <ChevronRight size={14} className="opacity-60" />
        <span className="text-text font-bold">Profile</span>
      </nav>

      {/* Header card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-panel-strong border border-border/30 rounded-card shrink-0 shadow-sm">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sora font-bold text-2xl shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-sora text-text truncate">{supplier.name}</h1>
              {supplier.businessId ? (
                <span
                  onClick={handleCopyBusinessId}
                  className="font-mono text-xs bg-panel px-2.5 py-0.5 rounded border border-border/30 cursor-pointer hover:bg-border/20 transition-colors text-text-muted select-all"
                  title="Click to copy Business ID"
                >
                  {supplier.businessId}
                </span>
              ) : (
                <span className="font-mono text-xs text-text-muted">"—"</span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  openStatus.isOpen ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20' : 'bg-danger/10 text-danger border border-danger/20'
                }`}
                title={openStatus.tooltip}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-[#16A34A]' : 'bg-danger'}`} />
                {openStatus.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {supplier.businessTypes?.map((bt) => (
                <span key={bt} className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {bt}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
              {supplier.phones[0] && (
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone size={12} /> {supplier.phones[0]}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1.5 font-mono">
                  <Mail size={12} /> {supplier.email}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={12} /> {supplier.location.label}, {supplier.location.city}
              </span>
            </div>

            <div className="pt-1">
              <VerificationBadges verification={supplier.verification} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <FollowButton isFollowed={isFollowed} onToggle={onToggleFollow} />
          <Button
            intent="secondary"
            size="md"
            onClick={() => onNavigate(`#purchases/supplier/${supplier.businessId}`)}
          >
            Storefront
          </Button>
        </div>
      </div>

      {/* Grid: Availability & Flags & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 shrink-0">
        {/* Availability Card */}
        <div className="p-5 bg-panel-strong border border-border/30 rounded-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Availability & Hours
            </h3>
            <span className="text-xs font-mono text-text-muted">{supplier.availability.openTime} - {supplier.availability.closeTime} EAT</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {daysOfWeek.map((day) => {
              const isToday = day === todayKey;
              const isAvailable = supplier.availability.days.includes(day as any);
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-center ${
                    isToday
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : isAvailable
                      ? 'bg-panel border-border/40 text-text'
                      : 'bg-panel/40 border-border/20 text-text-muted opacity-50'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{day}</span>
                  <span className="text-xs mt-0.5">{isAvailable ? '✓' : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flags & Badges Card */}
        <div className="p-5 bg-panel-strong border border-border/30 rounded-card space-y-4">
          <h3 className="font-bold text-sm text-text flex items-center gap-2">
            <CheckCircle size={16} className="text-primary" /> Capabilities & Flags
          </h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs p-2.5 rounded bg-panel border border-border/20">
              <span className="font-medium text-text">E-Pharmacy Capable</span>
              <StatusBadge status={supplier.flags.ePharmacy ? 'active' : 'inactive'} label={supplier.flags.ePharmacy ? 'Yes' : 'No'} />
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded bg-panel border border-border/20">
              <span className="font-medium text-text">Educational Partner</span>
              <StatusBadge status={supplier.flags.education ? 'active' : 'inactive'} label={supplier.flags.education ? 'Yes' : 'No'} />
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded bg-panel border border-border/20">
              <span className="font-medium text-text">Delivery Fleet</span>
              <StatusBadge status={supplier.flags.delivery ? 'active' : 'inactive'} label={supplier.flags.delivery ? 'Yes' : 'No'} />
            </div>
          </div>
        </div>

        {/* Your Deals Summary Card */}
        <div
          onClick={() => onNavigate(`#purchases/supplier/${supplier.businessId}?tab=deals`)}
          className="p-5 bg-panel-strong border border-border/30 rounded-card space-y-4 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="font-bold text-sm text-text mb-1">Your Deals & Orders</h3>
            <p className="text-xs text-text-muted">Summary of transactions with {supplier.name}</p>
          </div>
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Total Orders Placed</span>
              <span className="font-mono font-bold text-text">{totalOrdersCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Total Spend Basis</span>
              <span className="font-mono font-bold text-primary">TZS {totalTzsSum.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center justify-end text-xs font-bold text-primary gap-1">
            View Deals Tab <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="p-5 bg-panel-strong border border-border/30 rounded-card space-y-4 shrink-0">
        <h3 className="font-bold text-sm text-text">Services Offered</h3>
        {supplier.services.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4 text-center">No specialized services listed by this supplier.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {supplier.services.map((srv) => (
              <div key={srv.id} className="p-4 bg-panel border border-border/30 rounded-card space-y-1.5 elevation-flat">
                <h4 className="text-xs font-bold text-text">{srv.title}</h4>
                <p className="text-[11px] text-text-muted leading-relaxed">{srv.blurb}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Products Strip (Placeholder [V2]) */}
      <div className="p-5 bg-panel-strong border border-border/30 rounded-card space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-text">Featured Products (Top Deals)</h3>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">TODO: Cloud Profile [V2]</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {featuredProducts.map((prod) => (
            <div key={prod.id} className="p-3 bg-panel border border-border/30 rounded-card flex flex-col justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-text truncate">{prod.name}</p>
                <p className="text-[10px] text-text-muted truncate">{prod.genericName} • {prod.form}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <span className="font-mono text-xs font-bold text-primary">TZS {prod.unitPriceTzs.toLocaleString()}</span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">{prod.packSize}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
