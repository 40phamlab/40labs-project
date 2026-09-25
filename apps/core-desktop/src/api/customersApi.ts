import type { Customer } from '@40labs/types';
import { initialCustomers, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface AddCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  outstandingBalance?: number;
}

let customersStore: Customer[] = [...initialCustomers];

export const customersApi = {
  list: (): Customer[] => [...customersStore],

  get: (id: string): Customer | null => {
    return customersStore.find((c) => c.id === id) || null;
  },

  create: (payload: AddCustomerPayload): Customer => {
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

  update: (id: string, updates: UpdateCustomerPayload): Customer | null => {
    const index = customersStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = customersStore[index];
    const updated: Customer = {
      ...existing,
      full_name: updates.fullName ?? existing.full_name,
      phone: updates.phone ?? existing.phone,
      email: updates.email !== undefined ? updates.email : existing.email,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      outstanding_balance: updates.outstandingBalance ?? existing.outstanding_balance,
      updated_at: new Date().toISOString(),
    };

    customersStore[index] = updated;
    return updated;
  },

  updateCustomerNotes: (id: string, notes: string): Customer | null => {
    return customersApi.update(id, { notes });
  },

  delete: (id: string): boolean => {
    const initialLen = customersStore.length;
    customersStore = customersStore.filter((c) => c.id !== id);
    return customersStore.length < initialLen;
  },

  archive: (id: string): boolean => {
    return customersApi.delete(id);
  },

  // Backwards compatibility aliases
  getCustomers: (): Customer[] => customersApi.list(),
  addCustomer: (payload: AddCustomerPayload): Customer => customersApi.create(payload),
};

export const customers = customersApi;
