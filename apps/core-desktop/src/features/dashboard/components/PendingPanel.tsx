import * as React from 'react';
import { ArrowRight, ShoppingBag, FlaskConical, Stethoscope } from 'lucide-react';
import { Tooltip } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import type { DashboardSummary } from '../../../api/dashboardApi';

interface PendingPanelProps {
  summary: DashboardSummary;
}

export const PendingPanel: React.FC<PendingPanelProps> = ({ summary }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text border-b border-border/30 pb-2">
        {t('dashboard.pendingOrders')}
      </h3>

      <div className="space-y-2">
        {/* Purchase Orders */}
        <div
          onClick={() => setActiveScreen('purchases')}
          className="flex items-center justify-between p-3 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                {t('dashboard.purchaseOrders')}
              </p>
              <p className="text-[10px] font-mono font-bold text-text-muted">
                {summary.pendingPurchaseOrders} {t('dashboard.pendingOrders').toLowerCase()}
              </p>
            </div>
          </div>
          <ArrowRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
        </div>

        {/* 40Labs (Lab) */}
        <div
          onClick={() => setActiveScreen('lab')}
          className="flex items-center justify-between p-3 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FlaskConical size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                {t('dashboard.lab40Labs')}
              </p>
              <p className="text-[10px] font-mono font-bold text-text-muted">
                {summary.pendingLabOrders} {t('dashboard.pendingOrders').toLowerCase()}
              </p>
            </div>
          </div>
          <ArrowRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
        </div>

        {/* ePharmacy (Disabled + Tooltip) */}
        <Tooltip content={t('dashboard.comingSoon')}>
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-secondary/50 border border-border/20 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-panel-strong text-text-muted flex items-center justify-center">
                <Stethoscope size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted">
                  {t('dashboard.ePharmacy')}
                </p>
                <p className="text-[10px] text-text-muted italic">
                  {t('dashboard.comingSoon')}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60">
              --
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
