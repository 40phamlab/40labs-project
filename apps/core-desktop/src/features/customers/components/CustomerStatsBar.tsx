import * as React from 'react';
import { Plus } from 'lucide-react';
import { SearchInput, Button } from '@40labs/ui-components';
import { Customer } from '@40labs/types';

export interface CustomerStatsBarProps {
  customers: Customer[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

/**
 * CustomerStatsBar
 *
 * Top strip of the Customers screen. Renders static read-only reporting KPIs
 * (Today, Last Month, All, Reserved) alongside Debtors and Payables metrics, global search, and add actions.
 */
export const CustomerStatsBar: React.FC<CustomerStatsBarProps> = ({
  customers,
  searchTerm,
  onSearchChange,
  onAddClick,
}) => {
  const counts = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      today: customers.filter(
        (c) => new Date(c.created_at) >= startOfToday
      ).length,
      lastMonth: customers.filter((c) => {
        const d = new Date(c.created_at);
        return d >= startOfLastMonth && d < startOfCurrentMonth;
      }).length,
      all: customers.length,
      debtors: customers.filter((c) => c.outstanding_balance > 0).length,
      payables: customers.filter((c) => c.outstanding_balance < 0).length,
    };
  }, [customers]);

  const kpis = React.useMemo(() => [
    { label: 'Today', value: counts.today },
    { label: 'Last Month', value: counts.lastMonth },
    { label: 'All', value: counts.all },
    { label: 'Reserved', value: '—' },
  ], [counts]);

  return (
    <div className="flex items-center justify-between gap-6 p-4 bg-panel rounded-card border border-border/50 elevation-raised shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center divide-x divide-border/40">
          {kpis.map((kpi) => (
            <div className="flex flex-col px-4 first:pl-0" key={kpi.label}>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                {kpi.label}
              </span>
              <span className="text-lg font-bold text-text">{kpi.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 pl-4 border-l border-border/40">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-text-muted uppercase tracking-widest">
              Debtors
            </span>
            <span className="font-bold text-accent">{counts.debtors}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-text-muted uppercase tracking-widest">
              Payables
            </span>
            <span className="font-bold text-text">{counts.payables}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <SearchInput
          className="w-64"
          placeholder="Search name or phone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
        />
        <Button
          intent="primary"
          leftIcon={<Plus size={16} />}
          onClick={onAddClick}
        >
          Add Customer
        </Button>
      </div>
    </div>
  );
};
