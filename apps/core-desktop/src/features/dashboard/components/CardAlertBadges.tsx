// [phase: 8D-2] KPI Card Alert Badges
import * as React from 'react';
import type { Alert, AlertSeverity } from '@40labs/types';
import { t } from '@40labs/i18n';
import { ALERT_SEVERITY_ICONS, ALERT_SEVERITY_COLORS, SEVERITY_RANK } from '../../alerts/alertIcons';
import { useAlertStore } from '../../alerts/alertStore';

export interface CardAlertBadgesProps {
  alerts?: Alert[];
  worstSeverity?: AlertSeverity | null;
  onAlertClick?: (alert: Alert) => void;
}

export const CardAlertBadges: React.FC<CardAlertBadgesProps> = ({ alerts = [], onAlertClick }) => {
  const { acknowledged, acknowledge } = useAlertStore();

  if (!alerts || alerts.length === 0) return null;

  // Sort alerts by worst severity first
  const sorted = [...alerts].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const displayAlerts = sorted.slice(0, 3);
  const overflowCount = sorted.length > 3 ? sorted.length - 2 : 0;
  const finalBadges = sorted.length > 3 ? [...sorted.slice(0, 2)] : displayAlerts;

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      {finalBadges.map((alert) => {
        const Icon = ALERT_SEVERITY_ICONS[alert.severity] || ALERT_SEVERITY_ICONS.warning;
        const colors = ALERT_SEVERITY_COLORS[alert.severity] || ALERT_SEVERITY_COLORS.warning;
        const isAck = acknowledged[alert.key];
        const isCritical = alert.severity === 'critical';
        const titleText = `${t(alert.titleKey as any)} (${alert.count})`;

        return (
          <button
            key={alert.key}
            type="button"
            aria-label={`${alert.severity} alert: ${titleText}`}
            title={titleText}
            onClick={() => {
              acknowledge(alert.key);
              onAlertClick?.(alert);
            }}
            className={`
              relative w-5 h-5 rounded-[4px] flex items-center justify-center
              ${colors.bg} ${colors.text} border border-border/40
              transition-all cursor-pointer hover:scale-105 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring
              ${isAck ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <Icon
              size={11}
              className={isCritical ? 'animate-pulse' : ''}
              style={{
                animationDuration: isCritical ? '2s' : undefined,
              }}
            />
            {alert.count > 1 && (
              <span className="absolute -top-1 -right-1 font-mono text-[8px] font-bold px-1 bg-surface-elevated text-text border border-border rounded-full shadow-xs leading-none">
                {alert.count}
              </span>
            )}
          </button>
        );
      })}
      {sorted.length > 3 && (
        <span
          className="font-mono text-[9px] font-bold px-1 py-0.5 rounded bg-surface-secondary text-text-muted border border-border/50"
          title={`+${overflowCount} more alerts`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
};
