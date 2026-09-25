import { create } from 'zustand';
import type { Customer } from '@40labs/types';
import { customersApi, AddCustomerPayload } from '../api/customersApi';

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
  customers: customersApi.getCustomers(),
  searchTerm: '',
  selectedCustomerId: null,
  isAddModalOpen: false,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),
  setAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

  addCustomer: (payload) => {
    const newCustomer = customersApi.addCustomer(payload);

    set((state) => ({
      customers: [newCustomer, ...state.customers],
      isAddModalOpen: false,
      selectedCustomerId: newCustomer.id,
    }));

    return newCustomer;
  },

  updateCustomerNotes: (id, notes) => {
    customersApi.updateCustomerNotes(id, notes);
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, notes, updated_at: new Date().toISOString() } : c
      ),
    }));
  },
}));
