import * as React from 'react';
import { ArrowRight, ShoppingBag, FlaskConical, CheckCircle2 } from 'lucide-react';
import { Badge } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../../stores/useNavStore';
import type { DashboardSummary } from '../../../devData/dashboard/summary';

// GAP: SummaryPanel component is not present in @40labs/ui-components package.

interface PendingPanelProps {
  summary: DashboardSummary;
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

export const PendingPanel: React.FC<PendingPanelProps> = ({ summary }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  const poItems = summary.pending.purchaseOrders;
  const labItems = summary.pending.labOrders;
  const totalPending = summary.pending.total;

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-2">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text">
          {t('dashboard.pending')}
        </h3>
        <Badge variant={totalPending > 0 ? 'warning' : 'neutral'} size="sm">
          {totalPending}
        </Badge>
      </div>

      {/* Internal Scroll Container */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 flex-1">
        {totalPending === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-text-muted">
            <CheckCircle2 size={24} className="text-success" />
            <p className="text-xs font-ui italic">
              {t('dashboard.nothingPending')}
            </p>
          </div>
        ) : (
          <>
            {/* Purchase Orders Section */}
            {poItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                  <span className="uppercase tracking-wider">
                    {t('dashboard.purchaseOrders')} ({poItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('purchases')}
                    className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    {t('dashboard.view')} <ArrowRight size={10} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {poItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveScreen('purchases')}
                      className="p-2 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/20 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <ShoppingBag size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted shrink-0 ml-2">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Tests Section */}
            {labItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                  <span className="uppercase tracking-wider">
                    {t('dashboard.labTests')} ({labItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('lab')}
                    className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    {t('dashboard.view')} <ArrowRight size={10} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {labItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveScreen('lab')}
                      className="p-2 rounded-card bg-surface-secondary hover:bg-surface-hover border border-border/20 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FlaskConical size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted shrink-0 ml-2">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
