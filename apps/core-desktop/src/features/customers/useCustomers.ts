import { useQuery } from '@tanstack/react-query';
import type { Customer } from '@40labs/types';
import { mockCustomers } from '../../lib/mockData';

/**
 * Hook to fetch the full list of customers.
 * Read-only from mock data for MVP.
 */
export const useCustomerList = () => {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      // Direct read from mockData.ts as required.
      return mockCustomers;
    },
  });
};

/**
 * Hook to fetch a single customer by ID.
 * @param id The customer ID
 */
export const useCustomer = (id: string | null) => {
  return useQuery<Customer | undefined>({
    queryKey: ['customers', id],
    queryFn: async () => {
      if (!id) return undefined;
      return mockCustomers.find((c) => c.id === id);
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch customers with an outstanding balance > 0.
 * Results are sorted by outstanding_balance in descending order.
 */
export const useDebtors = () => {
  return useQuery<Customer[]>({
    queryKey: ['customers', 'debtors'],
    queryFn: async () => {
      return [...mockCustomers]
        .filter((c) => c.outstanding_balance > 0)
        .sort((a, b) => b.outstanding_balance - a.outstanding_balance);
    },
  });
};
