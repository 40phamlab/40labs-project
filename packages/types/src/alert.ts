export type AlertSeverity = 'info' | 'notice' | 'warning' | 'danger' | 'critical';
export type AlertDomain = 'sales' | 'profit' | 'customers' | 'stock' | 'expiry' | 'lab' | 'debts' | 'purchases';

export interface Alert {
  key: string; // ${domain}:${rule}:${entityId ?? 'all'}
  domain: AlertDomain;
  rule: string;
  severity: AlertSeverity;
  entityId?: string;
  count: number;
  firstSeenAt: string; // ISO string
  titleKey: string;
  detailKey: string;
  detailParams: Record<string, string | number>;
}
