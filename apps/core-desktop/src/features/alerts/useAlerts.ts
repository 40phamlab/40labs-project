import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import type { Alert, AlertDomain, AlertSeverity } from '@40labs/types';
import { inventoryApi } from '../../api/inventoryApi';
import { labApi } from '../../api/labApi';
import { customersApi } from '../../api/customersApi';
import { salesApi } from '../../api/salesApi';
import { purchasesApi } from '../../api/purchasesApi';
import { evaluateAlerts } from './evaluateAlerts';
import { DEFAULT_ALERT_THRESHOLDS, AlertThresholds } from './alertThresholds';
import { useAlertStore } from './alertStore';

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  notice: 2,
  warning: 3,
  danger: 4,
  critical: 5,
};

export interface UseAlertsResult {
  alerts: Alert[];
  byDomain: Record<AlertDomain, Alert[]>;
  worstByDomain: Record<AlertDomain, AlertSeverity | null>;
  acknowledge: (key: string) => void;
  mute: (key: string) => void;
  snooze: (key: string, untilMs: number) => void;
  clear: (key: string) => void;
}

export function useAlerts(thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS): UseAlertsResult {
  const [tick, setTick] = useState(0);

  // 60s timer for expiry crossing dates silently
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list(),
  });

  const { data: labOrders = [] } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: () => labApi.listOrders(),
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['lab-results'],
    queryFn: () => labApi.listResults(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.list(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchasesApi.list(),
  });

  const { mutedUntilResolved, snoozedUntil, acknowledge, mute, snooze, clear } = useAlertStore();

  const alerts = useMemo(() => {
    const rawAlerts = evaluateAlerts(
      {
        inventory,
        labOrders,
        labResults,
        customers,
        sales,
        purchaseOrders,
      },
      thresholds
    );

    const nowMs = Date.now();
    return rawAlerts.filter((alert) => {
      if (mutedUntilResolved[alert.key]) return false;
      const snoozed = snoozedUntil[alert.key];
      if (snoozed && snoozed > nowMs) return false;
      return true;
    });
  }, [inventory, labOrders, labResults, customers, sales, purchaseOrders, thresholds, mutedUntilResolved, snoozedUntil, tick]);

  const byDomain = useMemo(() => {
    const domains: Record<AlertDomain, Alert[]> = {
      sales: [],
      profit: [],
      customers: [],
      stock: [],
      expiry: [],
      lab: [],
      debts: [],
      purchases: [],
    };

    alerts.forEach((alert) => {
      if (domains[alert.domain]) {
        domains[alert.domain].push(alert);
      }
    });
    return domains;
  }, [alerts]);

  const worstByDomain = useMemo(() => {
    const result: Record<AlertDomain, AlertSeverity | null> = {
      sales: null,
      profit: null,
      customers: null,
      stock: null,
      expiry: null,
      lab: null,
      debts: null,
      purchases: null,
    };

    Object.keys(byDomain).forEach((domainKey) => {
      const domain = domainKey as AlertDomain;
      const domainAlerts = byDomain[domain];
      if (domainAlerts.length === 0) {
        result[domain] = null;
      } else {
        let worst: AlertSeverity = domainAlerts[0].severity;
        domainAlerts.forEach((a) => {
          if (SEVERITY_RANK[a.severity] > SEVERITY_RANK[worst]) {
            worst = a.severity;
          }
        });
        result[domain] = worst;
      }
    });

    return result;
  }, [byDomain]);

  return {
    alerts,
    byDomain,
    worstByDomain,
    acknowledge,
    mute,
    snooze,
    clear,
  };
}
