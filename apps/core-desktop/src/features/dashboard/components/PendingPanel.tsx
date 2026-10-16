// [phase: 8D] Aggregate Pending Items Panel (Zinazosubiri)
import * as React from 'react';
import { ArrowRight, ShoppingBag, FlaskConical, CheckCircle2 } from 'lucide-react';
import { Badge } from '@40labs/ui-components';
import { useNavStore } from '../../../stores/useNavStore';
import type { DashboardSummary } from '../../../devData/dashboard/summary';

interface PendingPanelProps {
  summary: DashboardSummary;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d`;
}

export const PendingPanel: React.FC<PendingPanelProps> = ({ summary }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  const poItems = summary.pending.purchaseOrders;
  const labItems = summary.pending.labOrders;
  const totalPending = summary.pending.total;

  return (
    <div className="bg-panel rounded-card border border-border/50 p-3 elevation-raised flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
        <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-text">
          Zinazosubiri
        </h3>
        <Badge variant={totalPending > 0 ? 'warning' : 'neutral'} size="sm">
          {totalPending}
        </Badge>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {totalPending === 0 ? (
          // One-line check-icon state per locked rule
          <div className="flex items-center gap-2 py-2 px-3 bg-surface-secondary/40 rounded-[6px] border border-border/30 text-xs text-text-muted font-ui">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>Hakuna vinavyosubiri</span>
          </div>
        ) : (
          <div className="space-y-3">
            {poItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted">
                  <span className="uppercase tracking-wider">
                    Ununuzi ({poItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('purchases')}
                    className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    Onyesha <ArrowRight size={10} />
                  </button>
                </div>
                <div className="space-y-1">
                  {poItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveScreen('purchases')}
                      className="p-1.5 rounded-[6px] bg-surface-secondary hover:bg-surface-hover border border-border/20 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-info/15 text-info flex items-center justify-center shrink-0">
                          <ShoppingBag size={11} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-text truncate group-hover:text-primary transition-colors">
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

            {labItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted">
                  <span className="uppercase tracking-wider">
                    Lab ({labItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('lab')}
                    className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    Onyesha <ArrowRight size={10} />
                  </button>
                </div>
                <div className="space-y-1">
                  {labItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveScreen('lab')}
                      className="p-1.5 rounded-[6px] bg-surface-secondary hover:bg-surface-hover border border-border/20 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-info/15 text-info flex items-center justify-center shrink-0">
                          <FlaskConical size={11} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-text truncate group-hover:text-primary transition-colors">
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
          </div>
        )}
      </div>
    </div>
  );
};
