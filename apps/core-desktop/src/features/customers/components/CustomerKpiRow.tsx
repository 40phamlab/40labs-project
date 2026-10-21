import * as React from 'react';
import { Users, UserPlus, CalendarDays, AlertCircle, Wallet } from 'lucide-react';
import type { CustomerStats } from '../hooks/useCustomerStats';

interface CustomerKpiRowProps {
  stats: CustomerStats;
}

export const CustomerKpiRow: React.FC<CustomerKpiRowProps> = ({ stats }) => {
  const formatter = React.useMemo(() => new Intl.NumberFormat('en-US'), []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 w-full">
      {/* 1. Total Directory (Hero Card - span 2) */}
      <div className="col-span-2 lg:col-span-2 p-4 bg-surface-primary rounded-[12px] border border-border-default elevation-raised flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
            Total Directory
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[28px] font-bold font-sora text-text">
            {formatter.format(stats.totalDirectory)}
          </span>
        </div>
      </div>

      {/* 2. New Today */}
      <div className="col-span-1 lg:col-span-1 p-4 bg-surface-primary rounded-[12px] border border-border-default elevation-raised flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <UserPlus size={16} />
          </div>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
            New Today
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-sora text-text">
            {formatter.format(stats.newToday)}
          </span>
        </div>
      </div>

      {/* 3. New This Month */}
      <div className="col-span-1 lg:col-span-1 p-4 bg-surface-primary rounded-[12px] border border-border-default elevation-raised flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays size={16} />
          </div>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
            New This Month
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-sora text-text">
            {formatter.format(stats.newThisMonth)}
          </span>
        </div>
      </div>

      {/* 4. Outstanding Debtors */}
      <div className="col-span-1 lg:col-span-1 p-4 bg-surface-primary rounded-[12px] border border-border-default elevation-raised flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
            Outstanding Debtors
          </span>
        </div>
        <div className="mt-3">
          <span
            className={`text-2xl font-bold font-sora ${
              stats.outstandingDebtorsCount > 0 ? 'text-warning' : 'text-text'
            }`}
          >
            {formatter.format(stats.outstandingDebtorsCount)}
          </span>
        </div>
      </div>

      {/* 5. Receivables */}
      <div className="col-span-1 lg:col-span-1 p-4 bg-surface-primary rounded-[12px] border border-border-default elevation-raised flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet size={16} />
          </div>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
            Receivables
          </span>
        </div>
        <div className="mt-3">
          <span className="text-lg lg:text-xl font-bold font-mono text-warning truncate">
            TZS {formatter.format(stats.totalReceivables)}
          </span>
        </div>
      </div>
    </div>
  );
};
