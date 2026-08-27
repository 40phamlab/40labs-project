import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@40labs/types';
import { mockCustomers } from '../../lib/mockData';

export const useCustomerList = () => useQuery<Customer[]>({ queryKey: ['customers'], queryFn: async () => [...mockCustomers] });
export const useCustomer = (id: string | null) => useQuery<Customer | undefined>({ queryKey: ['customers', id], queryFn: async () => id ? mockCustomers.find((customer) => customer.id === id) : undefined, enabled: !!id });
export const useDebtors = () => useQuery<Customer[]>({ queryKey: ['customers', 'debtors'], queryFn: async () => [...mockCustomers].filter((customer) => customer.outstanding_balance > 0).sort((a, b) => b.outstanding_balance - a.outstanding_balance) });

/** Mock seam for POST /customers; real SQLx/Tauri persistence replaces this mutation later. */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Pick<Customer, 'full_name' | 'phone' | 'email'>) => {
      const now = new Date().toISOString();
      const customer: Customer = { id: `cust_${Math.random().toString(36).slice(2, 10)}`, workspace_id: 'ws_dev_001', branch_id: 'br_dev_001', created_at: now, updated_at: now, full_name: input.full_name, phone: input.phone, email: input.email, outstanding_balance: 0, notes: null, amob_patient_id: null };
      mockCustomers.push(customer);
      return customer;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};
