import { create } from 'zustand';
import type { Customer } from '@40labs/types';
import { customers, AddCustomerPayload } from '../api/index.ts';

export type { AddCustomerPayload };

interface CustomersState {
  customers: Customer[];
  searchTerm: string;
  selectedCustomerId: string | null;
  isAddModalOpen: boolean;

  setSearchTerm: (term: string) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setAddModalOpen: (open: boolean) => void;

  loadCustomers: () => Promise<void>;
  addCustomer: (payload: AddCustomerPayload) => Promise<Customer>;
  updateCustomerNotes: (id: string, notes: string) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  searchTerm: '',
  selectedCustomerId: null,
  isAddModalOpen: false,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),
  setAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

  loadCustomers: async () => {
    const list = await customers.list();
    set({ customers: list });
  },

  addCustomer: async (payload) => {
    const newCustomer = await customers.create(payload);

    set((state) => ({
      customers: [newCustomer, ...state.customers],
      isAddModalOpen: false,
      selectedCustomerId: newCustomer.id,
    }));

    return newCustomer;
  },

  updateCustomerNotes: async (id, notes) => {
    const updated = await customers.updateCustomerNotes(id, notes);
    if (updated) {
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? updated : c)),
      }));
    }
  },
}));
