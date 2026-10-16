// [phase: 8D] 8 Domain KPIs Grid
import * as React from 'react';
import type { DashboardKpi } from '@40labs/types';
import type { DashboardSummary } from '../../../api/dashboardApi';
import { KpiCard } from './KpiCard';

interface KPIRowsProps {
  summary: DashboardSummary;
  onSelectMetric?: (id: DashboardKpi['id']) => void;
}

export const KPIRows: React.FC<KPIRowsProps> = ({ summary, onSelectMetric }) => {
  const kpis = summary.kpis;

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard kpi={kpis.sales} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.profit} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.customers} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.stock} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.expiry} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.lab} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.balances} onSelectMetric={onSelectMetric} />
      <KpiCard kpi={kpis.purchases} onSelectMetric={onSelectMetric} />
    </div>
  );
};
