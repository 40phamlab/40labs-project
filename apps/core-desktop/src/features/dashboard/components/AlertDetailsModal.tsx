// [phase: 8D-2] Alert Details & Action Modal
import * as React from 'react';
import { Dialog, Button } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import type { Alert } from '@40labs/types';
import { ALERT_SEVERITY_ICONS, ALERT_SEVERITY_COLORS } from '../../alerts/alertIcons';

export interface AlertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  onAction?: (alert: Alert) => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({ isOpen, onClose, alert, onAction }) => {
  if (!alert) return null;

  const Icon = ALERT_SEVERITY_ICONS[alert.severity] || ALERT_SEVERITY_ICONS.warning;
  const colors = ALERT_SEVERITY_COLORS[alert.severity] || ALERT_SEVERITY_COLORS.warning;

  const getActionLabel = (domain: string) => {
    switch (domain) {
      case 'stock':
        return 'Re-fill Stock';
      case 'expiry':
        return 'View Batch';
      case 'lab':
        return 'Review Lab';
      case 'debts':
        return 'View Customer';
      case 'purchases':
        return 'Approve PO';
      default:
        return 'Resolve';
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t(alert.titleKey as any)}>
      <div className="space-y-4 p-2">
        <div className="flex items-center gap-3 p-3 rounded-card bg-surface-secondary/50 border border-border/50">
          <div className={`w-8 h-8 rounded-card flex items-center justify-center ${colors.bg} ${colors.text}`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {alert.domain} / {alert.rule}
            </div>
            <div className="text-sm font-semibold text-text">{t(alert.titleKey as any)}</div>
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface-primary border border-border space-y-2">
          <div className="text-xs text-text-secondary leading-relaxed">
            Count affected: <span className="font-mono font-bold text-text">{alert.count}</span>
          </div>
          <div className="text-xs text-text-muted">
            Key: <code className="font-mono text-[10px] text-text-secondary">{alert.key}</code>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Funga (Close)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onAction?.(alert);
              onClose();
            }}
          >
            {getActionLabel(alert.domain)}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
