import { create } from 'zustand';
import type { Customer } from '@40labs/types';
import { mockCustomers, WORKSPACE_ID, BRANCH_ID } from '../lib/mockData.ts';

export interface AddCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

interface CustomersState {
  customers: Customer[];
  searchTerm: string;
  selectedCustomerId: string | null;
  isAddModalOpen: boolean;

  setSearchTerm: (term: string) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setAddModalOpen: (open: boolean) => void;

  addCustomer: (payload: AddCustomerPayload) => Customer;
  updateCustomerNotes: (id: string, notes: string) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: mockCustomers,
  searchTerm: '',
  selectedCustomerId: null,
  isAddModalOpen: false,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),
  setAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

  addCustomer: (payload) => {
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

    set((state) => ({
      customers: [newCustomer, ...state.customers],
      isAddModalOpen: false,
      selectedCustomerId: newCustomer.id,
    }));

    return newCustomer;
  },

  updateCustomerNotes: (id, notes) => set((state) => ({
    customers: state.customers.map((c) =>
      c.id === id ? { ...c, notes, updated_at: new Date().toISOString() } : c
    ),
  })),
}));
