import type { Customer } from '@40labs/types';
import { initialCustomers, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface AddCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

let customersStore: Customer[] = [...initialCustomers];

export const customersApi = {
  getCustomers: (): Customer[] => [...customersStore],

  addCustomer: (payload: AddCustomerPayload): Customer => {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      full_name: payload.fullName,
      phone: payload.phone,
      email: payload.email || null,
      outstanding_balance: 0,
      notes: payload.notes || null,
      amob_patient_id: null,
    };

    customersStore = [newCustomer, ...customersStore];
    return newCustomer;
  },

  updateCustomerNotes: (id: string, notes: string): Customer | null => {
    const index = customersStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated: Customer = {
      ...customersStore[index],
      notes,
      updated_at: new Date().toISOString(),
    };

    customersStore[index] = updated;
    return updated;
  },
};
