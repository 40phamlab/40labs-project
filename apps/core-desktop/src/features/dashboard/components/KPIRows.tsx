import * as React from 'react';
import { KPIGrid, KPICard, MoneyDisplay } from '@40labs/ui-components';
import { t } from '@40labs/i18n';
import type { DashboardSummary } from '../../../api/dashboardApi';

interface KPIRowsProps {
  summary: DashboardSummary;
}

export const KPIRows: React.FC<KPIRowsProps> = ({ summary }) => {
  return (
    <div className="space-y-4">
      {/* KPI Row 1 */}
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

      {/* KPI Row 2 */}
      <KPIGrid>
        <KPICard
          title={t('dashboard.supplierDebt')}
          value={<MoneyDisplay amount={summary.supplierDebt} /> as unknown as string}
          tone="accent"
        />
        <KPICard
          title={t('dashboard.customersDebt')}
          value={<MoneyDisplay amount={summary.customerDebt} /> as unknown as string}
          tone="accent"
        />
        <KPICard
          title={t('dashboard.customerBalance')}
          value={<MoneyDisplay amount={summary.customerBalance} /> as unknown as string}
          tone="default"
        />
        <KPICard
          title={t('dashboard.inventoryValue')}
          value={<MoneyDisplay amount={summary.inventoryValue} /> as unknown as string}
          tone="default"
        />
      </KPIGrid>
    </div>
  );
};
