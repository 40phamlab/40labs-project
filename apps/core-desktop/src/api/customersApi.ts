import type { Customer } from '@40labs/types';
import { initialCustomers, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

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
  list: async (): Promise<Customer[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer[]>('get_customers_list');
    }
    return [...customersStore];
  },

  get: async (id: string): Promise<Customer | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer | null>('get_customer', { id });
    }
    return customersStore.find((c) => c.id === id) || null;
  },

  create: async (payload: AddCustomerPayload): Promise<Customer> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer>('create_customer', { payload });
    }

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

  update: async (id: string, updates: UpdateCustomerPayload): Promise<Customer | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer>('update_customer', { id, payload: updates });
    }

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

  updateCustomerNotes: (id: string, notes: string): Promise<Customer | null> => {
    return customersApi.update(id, { notes });
  },

  delete: async (id: string): Promise<boolean> => {
    const initialLen = customersStore.length;
    customersStore = customersStore.filter((c) => c.id !== id);
    return customersStore.length < initialLen;
  },

  archive: (id: string): Promise<boolean> => {
    return customersApi.delete(id);
  },

  // Backwards compatibility aliases
  getCustomers: (): Promise<Customer[]> => customersApi.list(),
  addCustomer: (payload: AddCustomerPayload): Promise<Customer> => customersApi.create(payload),
};

export const customers = customersApi;
