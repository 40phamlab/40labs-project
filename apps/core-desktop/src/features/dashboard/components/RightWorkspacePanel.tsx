import * as React from 'react';
import {
  ShoppingCart,
  UserPlus,
  PackagePlus,
  BarChart3,
  ArrowRight,
  ShoppingBag,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { SearchInput, Badge } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import { useCustomersStore } from '../../../stores/useCustomersStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import type { DashboardSummary } from '../../../devData/dashboard/summary';

interface RightWorkspacePanelProps {
  summary: DashboardSummary;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export const RightWorkspacePanel: React.FC<RightWorkspacePanelProps> = ({
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
      icon: <ShoppingCart size={14} />,
      onClick: handleNewSale,
      colorClass: 'text-primary bg-primary/10',
    },
    {
      label: t('dashboard.addPatient'),
      icon: <UserPlus size={14} />,
      onClick: handleAddPatient,
      colorClass: 'text-accent bg-accent/10',
    },
    {
      label: t('dashboard.addStock'),
      icon: <PackagePlus size={14} />,
      onClick: handleAddStock,
      colorClass: 'text-info bg-info/10',
    },
    {
      label: t('dashboard.viewReports'),
      icon: <BarChart3 size={14} />,
      onClick: handleViewReports,
      colorClass: 'text-text-muted bg-surface-hover',
    },
  ];

  const poItems = summary.pending.purchaseOrders;
  const labItems = summary.pending.labOrders;
  const totalPending = summary.pending.total;

  return (
    <div className="bg-panel rounded-card border border-border/40 p-4 elevation-raised flex flex-col gap-4">
      {/* 1. Search Section */}
      <div className="relative">
        <SearchInput
          ref={searchInputRef}
          placeholder={t('dashboard.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onSearchClear}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border/20" />

      {/* 2. Quick Actions (Compact Action Tiles / Buttons without inner cards) */}
      <div className="flex flex-col gap-2">
        <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-text-muted px-0.5">
          {t('dashboard.quickActions')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              className="flex items-center gap-2 py-2 px-2.5 rounded hover:bg-surface-hover/70 transition-colors group cursor-pointer text-left"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${action.colorClass}`}>
                {action.icon}
              </div>
              <span className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/20" />

      {/* 3. Pending / Notifications (Dense List-Based Layout without inner cards) */}
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('dashboard.pending')}
          </span>
          <Badge variant={totalPending > 0 ? 'warning' : 'neutral'} size="sm">
            {totalPending}
          </Badge>
        </div>

        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-0.5">
          {totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5 text-text-muted">
              <CheckCircle2 size={20} className="text-success" />
              <p className="text-[11px] font-ui italic">
                {t('dashboard.nothingPending')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Purchase Orders Dense List */}
              {poItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted px-0.5">
                    <span>{t('dashboard.purchaseOrders')} ({poItems.length})</span>
                    <button
                      type="button"
                      onClick={() => setActiveScreen('purchases')}
                      className="inline-flex items-center gap-0.5 text-primary hover:underline cursor-pointer text-[10px]"
                    >
                      {t('dashboard.view')} <ArrowRight size={9} />
                    </button>
                  </div>
                  <div className="divide-y divide-border/15">
                    {poItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveScreen('purchases')}
                        className="py-2 px-1 hover:bg-surface-hover/60 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <ShoppingBag size={12} className="text-accent shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-text truncate group-hover:text-primary transition-colors block">
                              {item.title}
                            </span>
                            <span className="text-[9px] text-text-muted font-mono truncate block">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted shrink-0 ml-2">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Tests Dense List */}
              {labItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted px-0.5">
                    <span>{t('dashboard.labTests')} ({labItems.length})</span>
                    <button
                      type="button"
                      onClick={() => setActiveScreen('lab')}
                      className="inline-flex items-center gap-0.5 text-primary hover:underline cursor-pointer text-[10px]"
                    >
                      {t('dashboard.view')} <ArrowRight size={9} />
                    </button>
                  </div>
                  <div className="divide-y divide-border/15">
                    {labItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveScreen('lab')}
                        className="py-2 px-1 hover:bg-surface-hover/60 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <FlaskConical size={12} className="text-primary shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-text truncate group-hover:text-primary transition-colors block">
                              {item.title}
                            </span>
                            <span className="text-[9px] text-text-muted font-mono truncate block">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted shrink-0 ml-2">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
