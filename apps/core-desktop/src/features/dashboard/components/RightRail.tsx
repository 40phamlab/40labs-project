import * as React from 'react';
import {
  ShoppingCart,
  UserPlus,
  PackagePlus,
  BarChart3,
  ShoppingBag,
  FlaskConical,
  Lock,
} from 'lucide-react';
import { SearchInput, Badge, Tooltip } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import { useCustomersStore } from '../../../stores/useCustomersStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import type { DashboardSummary } from '../../../devData/dashboard/summary';

interface RightRailProps {
  summary: DashboardSummary;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

function translateLabStatus(status: string): string {
  switch (status) {
    case 'pending': return t('dashboard.statusPending');
    case 'sample_collected': return t('dashboard.statusSampleCollected');
    case 'result_entered': return t('dashboard.statusResultEntered');
    case 'report_ready': return t('dashboard.statusReportReady');
    default: return status;
  }
}

export const RightRail: React.FC<RightRailProps> = ({
  summary,
  searchQuery,
  onSearchChange,
  onSearchClear,
  searchInputRef,
}) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const setAddPatientModalOpen = useCustomersStore((s) => s.setAddModalOpen);
  const setInventoryModalOpen = useInventoryStore((s) => s.setModalOpen);

  const handleNewSale = () => setActiveScreen('sales');
  const handleAddPatient = () => {
    setAddPatientModalOpen(true);
    setActiveScreen('customers');
  };
  const handleAddStock = () => {
    setInventoryModalOpen(true);
    setActiveScreen('inventory');
  };
  const handleViewReports = () => setActiveScreen('reports');

  const actions = [
    {
      label: t('dashboard.newSale'),
      icon: <ShoppingCart size={13} />,
      onClick: handleNewSale,
      colorClass: 'text-primary bg-primary/10',
    },
    {
      label: t('dashboard.addPatient'),
      icon: <UserPlus size={13} />,
      onClick: handleAddPatient,
      colorClass: 'text-accent bg-accent/10',
    },
    {
      label: t('dashboard.addStock'),
      icon: <PackagePlus size={13} />,
      onClick: handleAddStock,
      colorClass: 'text-info bg-info/10',
    },
    {
      label: t('dashboard.viewReports'),
      icon: <BarChart3 size={13} />,
      onClick: handleViewReports,
      colorClass: 'text-text-muted bg-surface-hover',
    },
  ];

  const poItems = summary.pending.purchaseOrders;
  const labItems = summary.pending.labOrders;

  return (
    <div className="bg-panel rounded-card border border-border/40 p-4 elevation-raised flex flex-col gap-3.5 h-full overflow-hidden">
      {/* 1. Search Section */}
      <div className="relative shrink-0">
        <SearchInput
          ref={searchInputRef}
          placeholder={t('dashboard.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onSearchClear}
        />
      </div>

      <div className="border-t border-border/20 shrink-0" />

      {/* 2. Quick Actions (2x2 Text Buttons) */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-text-muted px-0.5">
          {t('dashboard.quickActions')}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-hover/75 transition-colors group cursor-pointer text-left"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${action.colorClass}`}>
                {action.icon}
              </div>
              <span className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/20 shrink-0" />

      {/* 3. Pending / Notifications (THREE TILED SECTIONS: Purchases Orders, ePharmacy, 40Labs) */}
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-0.5">
        <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-text-muted px-0.5 shrink-0">
          {t('dashboard.pending')}
        </span>

        {/* Tile 1: Purchases Orders */}
        <div className="bg-surface-secondary/60 rounded border border-border/20 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShoppingBag size={13} className="text-accent shrink-0" />
              <span className="text-xs font-bold text-text truncate">{t('dashboard.purchaseOrders')}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={poItems.length > 0 ? 'warning' : 'neutral'} size="sm">
                {poItems.length}
              </Badge>
              {poItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveScreen('purchases')}
                  className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                >
                  {t('dashboard.view')}
                </button>
              )}
            </div>
          </div>

          {poItems.length === 0 ? (
            <p className="text-[10px] text-text-muted italic px-0.5">{t('dashboard.nothingPending')}</p>
          ) : (
            <div className="space-y-1.5">
              {poItems.slice(0, 2).map((item, idx) => {
                const humanTitle = t('dashboard.orderOrdinal').replace('{n}', String(idx + 1));
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveScreen('purchases')}
                    className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded hover:bg-surface-hover transition-colors cursor-pointer group"
                  >
                    <span className="font-bold text-text truncate group-hover:text-primary min-w-0 pr-2">
                      {humanTitle}
                    </span>
                    <span className="font-mono text-text-muted shrink-0 text-[10px]">
                      {item.subtitle.split('•')[1] || item.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tile 2: 40Labs (Lab Tests) */}
        <div className="bg-surface-secondary/60 rounded border border-border/20 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <FlaskConical size={13} className="text-primary shrink-0" />
              <span className="text-xs font-bold text-text truncate">{t('dashboard.lab40Labs')}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={labItems.length > 0 ? 'warning' : 'neutral'} size="sm">
                {labItems.length}
              </Badge>
              {labItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveScreen('lab')}
                  className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                >
                  {t('dashboard.view')}
                </button>
              )}
            </div>
          </div>

          {labItems.length === 0 ? (
            <p className="text-[10px] text-text-muted italic px-0.5">{t('dashboard.nothingPending')}</p>
          ) : (
            <div className="space-y-1.5">
              {labItems.slice(0, 2).map((item, idx) => {
                const humanTitle = t('dashboard.labOrdinal').replace('{n}', String(idx + 1));
                const statusMatch = item.subtitle.match(/Status:\s*(\w+)/);
                const statusStr = statusMatch ? translateLabStatus(statusMatch[1]) : item.subtitle;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveScreen('lab')}
                    className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded hover:bg-surface-hover transition-colors cursor-pointer group"
                  >
                    <span className="font-bold text-text truncate group-hover:text-primary min-w-0 pr-2">
                      {humanTitle}
                    </span>
                    <span className="text-text-muted shrink-0 text-[10px]">
                      {statusStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tile 3: ePharmacy (Disabled tile per design) */}
        <Tooltip content={t('dashboard.comingSoon')}>
          <div className="bg-surface-secondary/30 rounded border border-border/10 p-2.5 flex items-center justify-between opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-1.5 min-w-0">
              <Lock size={13} className="text-text-muted shrink-0" />
              <span className="text-xs font-bold text-text-muted truncate">{t('dashboard.ePharmacy')}</span>
            </div>
            <Badge variant="neutral" size="sm">
              —
            </Badge>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
