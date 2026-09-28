import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import type { DashboardSummary } from '../../../api/dashboardApi';

interface BusinessHealthPanelProps {
  summary: DashboardSummary;
}

export const BusinessHealthPanel: React.FC<BusinessHealthPanelProps> = ({ summary }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const setFilterExpired = useInventoryStore((s) => s.setFilterExpired);

  const handleViewExpired = () => {
    setFilterExpired(true);
    setActiveScreen('inventory');
  };

  const handleViewEmpty = () => {
    // GAP: useInventoryStore has setFilterExpired(bool), but lacks setFilterEmpty(bool).
    // TODO: [reason: no empty items filter exists in useInventoryStore] [phase: post-MVP]
    setFilterExpired(false);
    setActiveScreen('inventory');
  };

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3 h-full">
      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text border-b border-border/30 pb-2">
        {t('dashboard.businessHealth')}
      </h3>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Total Stock */}
        <div className="p-3 bg-surface-secondary rounded-card border border-border/30 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('dashboard.totalStock')}
          </span>
          <span className="text-xl font-mono font-bold text-text mt-1">
            {summary.totalStock.toLocaleString()}
          </span>
        </div>

        {/* Categories */}
        <div className="p-3 bg-surface-secondary rounded-card border border-border/30 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('dashboard.categories')}
          </span>
          <span className="text-xl font-mono font-bold text-text mt-1">
            {summary.categories}
          </span>
        </div>

        {/* Empty */}
        <div className="p-3 bg-surface-secondary rounded-card border border-border/30 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t('dashboard.emptyItems')}
            </span>
            <button
              type="button"
              onClick={handleViewEmpty}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
            >
              {t('dashboard.view')} <ArrowRight size={10} />
            </button>
          </div>
          <span
            className={`text-xl font-mono font-bold mt-1 ${
              summary.emptyItems > 0 ? 'text-accent' : 'text-text'
            }`}
          >
            {summary.emptyItems}
          </span>
        </div>

        {/* Expire */}
        <div className="p-3 bg-surface-secondary rounded-card border border-border/30 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t('dashboard.expiredItems')}
            </span>
            <button
              type="button"
              onClick={handleViewExpired}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
            >
              {t('dashboard.view')} <ArrowRight size={10} />
            </button>
          </div>
          <span
            className={`text-xl font-mono font-bold mt-1 ${
              summary.expiredItems > 0 ? 'text-danger' : 'text-text'
            }`}
          >
            {summary.expiredItems}
          </span>
        </div>
      </div>
    </div>
  );
};
