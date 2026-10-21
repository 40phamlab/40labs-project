// [phase: 6D] Toast Reactivity Hook over alerts
import * as React from 'react';
import { useAlerts } from './useAlerts';
import { useToast } from '../../hooks/useToast';
import { useAlertStore } from './alertStore';
import { t } from '@40labs/i18n';
import type { AlertSeverity } from '@40labs/types';
import { useNavStore } from '../../stores/useNavStore';

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  notice: 2,
  warning: 3,
  danger: 4,
  critical: 5,
};

export function useAlertToasts() {
  const { alerts } = useAlerts();
  const { toast } = useToast();
  const { acknowledged, snooze } = useAlertStore();
  const prevSeveritiesRef = React.useRef<Map<string, AlertSeverity>>(new Map());

  React.useEffect(() => {
    const currentMap = new Map<string, AlertSeverity>();

    alerts.forEach((alert) => {
      currentMap.set(alert.key, alert.severity);
      const prevSeverity = prevSeveritiesRef.current.get(alert.key);
      const isNew = !prevSeverity;
      const isEscalated = prevSeverity && SEVERITY_RANK[alert.severity] > SEVERITY_RANK[prevSeverity];

      if ((isNew || isEscalated) && !acknowledged[alert.key]) {
        const title = t(alert.titleKey as any);
        const detail = t(alert.detailKey as any);

        toast.show({
          key: alert.key,
          severity: alert.severity,
          title,
          detail,
          persistent: alert.severity === 'danger' || alert.severity === 'critical',
          actions: [
            {
              label: 'View',
              variant: 'primary',
              onClick: () => {
                if (alert.domain === 'stock' || alert.domain === 'expiry') {
                  useNavStore.getState().setActiveScreen('inventory');
                } else if (alert.domain === 'lab') {
                  useNavStore.getState().setActiveScreen('lab');
                } else if (alert.domain === 'purchases') {
                  useNavStore.getState().setActiveScreen('purchases');
                } else {
                  useNavStore.getState().setActiveScreen('dashboard');
                }
              },
            },
            {
              label: 'Re-fill',
              variant: 'secondary',
              requiresPin: alert.severity === 'critical' || alert.severity === 'danger',
              onClick: () => {
                useNavStore.getState().setActiveScreen('inventory');
              },
            },
            {
              label: 'Snooze',
              variant: 'ghost',
              onClick: () => {
                const snoozeUntilMs = Date.now() + 4 * 3600 * 1000; // 4 hours
                snooze(alert.key, snoozeUntilMs);
              },
            },
          ],
        });
      }
    });

    prevSeveritiesRef.current = currentMap;
  }, [alerts, acknowledged, toast, snooze]);
}
