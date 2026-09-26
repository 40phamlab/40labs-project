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

  addCustomer: (payload: AddCustomerPayload) => Customer;
  updateCustomerNotes: (id: string, notes: string) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: customers.list(),
  searchTerm: '',
  selectedCustomerId: null,
  isAddModalOpen: false,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),
  setAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

  addCustomer: (payload) => {
    const newCustomer = customers.create(payload);

    set((state) => ({
      customers: [newCustomer, ...state.customers],
      isAddModalOpen: false,
      selectedCustomerId: newCustomer.id,
    }));

    return newCustomer;
  },

  updateCustomerNotes: (id, notes) => {
    customers.updateCustomerNotes(id, notes);
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, notes, updated_at: new Date().toISOString() } : c
      ),
    }));
  },
}));
