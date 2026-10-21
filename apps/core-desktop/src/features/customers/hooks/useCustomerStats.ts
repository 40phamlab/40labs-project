import * as React from 'react';
import type { Customer } from '@40labs/types';

export interface CustomerStats {
  totalDirectory: number;
  newToday: number;
  newThisMonth: number;
  outstandingDebtorsCount: number;
  totalReceivables: number;
}

export function useCustomerStats(customers: Customer[]): CustomerStats {
  return React.useMemo(() => {
    const activeCustomers = customers.filter((c) => !c.archived_at);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let newToday = 0;
    let newThisMonth = 0;
    let outstandingDebtorsCount = 0;
    let totalReceivables = 0;

    for (const c of activeCustomers) {
      const createdAtTime = new Date(c.created_at).getTime();
      if (createdAtTime >= startOfToday) {
        newToday++;
      }
      if (createdAtTime >= startOfMonth) {
        newThisMonth++;
      }
      if (c.outstanding_balance > 0) {
        outstandingDebtorsCount++;
        totalReceivables += c.outstanding_balance;
      }
    }

    return {
      totalDirectory: activeCustomers.length,
      newToday,
      newThisMonth,
      outstandingDebtorsCount,
      totalReceivables,
    };
  }, [customers]);
}
