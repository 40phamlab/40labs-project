import { create } from 'zustand';
import { Customer } from '../features/customers/types';

interface CustomerStore {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
}));
