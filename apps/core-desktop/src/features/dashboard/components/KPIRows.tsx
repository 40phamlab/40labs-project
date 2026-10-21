// [phase: 8D-2] 8 Domain KPIs Grid with Alert Badges & Severity Rings
import * as React from 'react';
import type { DashboardKpi, Alert, AlertDomain, AlertSeverity } from '@40labs/types';
import type { DashboardSummary } from '../../../api/dashboardApi';
import { KpiCard } from './KpiCard';

interface KPIRowsProps {
  summary: DashboardSummary;
  byDomain?: Record<AlertDomain, Alert[]>;
  worstByDomain?: Record<AlertDomain, AlertSeverity | null>;
  onSelectMetric?: (id: DashboardKpi['id']) => void;
  onAlertClick?: (alert: Alert) => void;
}

const DOMAIN_MAP: Record<DashboardKpi['id'], AlertDomain> = {
  sales: 'sales',
  profit: 'profit',
  customers: 'customers',
  stock: 'stock',
  expiry: 'expiry',
  lab: 'lab',
  balances: 'debts',
  purchases: 'purchases',
};

export const KPIRows: React.FC<KPIRowsProps> = ({
  summary,
  byDomain,
  worstByDomain,
  onSelectMetric,
  onAlertClick,
}) => {
  const kpis = summary.kpis;

  if (!kpis) return null;

  const renderCard = (id: DashboardKpi['id']) => {
    const kpi = kpis[id];
    const domain = DOMAIN_MAP[id];
    const alerts = byDomain ? byDomain[domain] : [];
    const worstSeverity = worstByDomain ? worstByDomain[domain] : null;

    return (
      <KpiCard
        key={id}
        kpi={kpi}
        alerts={alerts}
        worstSeverity={worstSeverity}
        onSelectMetric={onSelectMetric}
        onAlertClick={onAlertClick}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {renderCard('sales')}
      {renderCard('profit')}
      {renderCard('customers')}
      {renderCard('stock')}
      {renderCard('expiry')}
      {renderCard('lab')}
      {renderCard('balances')}
      {renderCard('purchases')}
    </div>
  );
};
