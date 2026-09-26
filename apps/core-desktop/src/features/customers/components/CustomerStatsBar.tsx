import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel } from '@40labs/ui-components';

export interface CustomerStatsBarProps {
  customers: Customer[];
}

/**
 * CustomerStatsBar
 *
 * Top strip of the Customers screen. Renders summary metrics for customers, debtors, and payables.
 */
export const CustomerStatsBar: React.FC<CustomerStatsBarProps> = ({ customers }) => {
  const counts = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      today: customers.filter((c) => new Date(c.created_at) >= startOfToday).length,
      lastMonth: customers.filter((c) => {
        const d = new Date(c.created_at);
        return d >= startOfLastMonth && d < startOfCurrentMonth;
      }).length,
      all: customers.length,
      debtors: customers.filter((c) => c.outstanding_balance > 0).length,
      payables: customers.filter((c) => c.outstanding_balance < 0).length,
    };
  }, [customers]);

  const kpis = React.useMemo(
    () => [
      { label: 'New Today', value: counts.today },
      { label: 'Last Month', value: counts.lastMonth },
      { label: 'Total Directory', value: counts.all },
    ],
    [counts]
  );

  return (
    <Panel className="p-3 py-2.5 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6 divide-x divide-border/40">
        {kpis.map((kpi, idx) => (
          <div className={`flex flex-col ${idx > 0 ? 'pl-6' : ''}`} key={kpi.label}>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {kpi.label}
            </span>
            <span className="text-xl font-bold text-text mt-0.5">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 divide-x divide-border/40">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Outstanding Debtors
          </span>
          <span className="text-lg font-bold text-warning mt-0.5">{counts.debtors}</span>
        </div>
        <div className="flex flex-col pl-6">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Credit Balance (Payables)
          </span>
          <span className="text-lg font-bold text-text mt-0.5">{counts.payables}</span>
        </div>
      </div>
    </Panel>
  );
};
