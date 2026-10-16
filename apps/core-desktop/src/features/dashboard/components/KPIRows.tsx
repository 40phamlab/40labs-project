// [phase: 8D] 8 Domain KPIs Row
import * as React from 'react';
import { KPIGrid, KPICard, MoneyDisplay } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import type { DashboardSummary } from '../../../api/dashboardApi';

interface KPIRowsProps {
  summary: DashboardSummary;
}

export const KPIRows: React.FC<KPIRowsProps> = ({ summary }) => {
  const kpis = summary.kpis;

  if (!kpis) {
    // Fallback for legacy summary objects
    return (
      <div className="space-y-4">
        <KPIGrid>
          <KPICard
            title={t('dashboard.monthlyProfit')}
            value={<MoneyDisplay amount={summary.monthlyProfit} /> as unknown as string}
            tone="default"
          />
          <KPICard
            title={t('dashboard.profit')}
            value={<MoneyDisplay amount={summary.profit} /> as unknown as string}
            tone="primary"
          />
          <KPICard
            title={t('dashboard.todaysSales')}
            value={<MoneyDisplay amount={summary.todaysSales} /> as unknown as string}
            tone="default"
          />
          <KPICard
            title={t('dashboard.transactions')}
            value={String(summary.transactions)}
            tone="default"
          />
        </KPIGrid>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Sales, Profit, Customers, Stock */}
      <KPIGrid>
        <KPICard
          title={t('dashboard.todaysSales') || "Today's Sales"}
          value={<MoneyDisplay amount={kpis.sales.value} /> as unknown as string}
          kpi={kpis.sales}
          tone="default"
        />
        <KPICard
          title={t('dashboard.monthlyProfit') || "Monthly Profit"}
          value={<MoneyDisplay amount={kpis.profit.value} /> as unknown as string}
          kpi={kpis.profit}
          tone="primary"
        />
        <KPICard
          title="Customers"
          value={String(kpis.customers.value)}
          kpi={kpis.customers}
          tone="default"
        />
        <KPICard
          title="Active Stock SKUs"
          value={String(kpis.stock.value)}
          kpi={kpis.stock}
          tone="default"
        />
      </KPIGrid>

      {/* Row 2: Expiry, Lab, Balances, Purchases */}
      <KPIGrid>
        <KPICard
          title="Expiring (≤90d)"
          value={String(kpis.expiry.value)}
          kpi={kpis.expiry}
          tone="danger"
        />
        <KPICard
          title="Lab Tests Today"
          value={String(kpis.lab.value)}
          kpi={kpis.lab}
          tone="default"
        />
        <KPICard
          title="Net Debt Balance"
          value={<MoneyDisplay amount={kpis.balances.value} /> as unknown as string}
          kpi={kpis.balances}
          tone="accent"
        />
        <KPICard
          title="Open Purchase Orders"
          value={String(kpis.purchases.value)}
          kpi={kpis.purchases}
          tone="default"
        />
      </KPIGrid>
    </div>
  );
};
