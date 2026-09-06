import type { Customer } from '@40labs/types';

export const mockCustomer: Customer = {
  id: 'cust_123',
  full_name: 'Jane Doe',
  phone: '+255 700 000 000',
  email: 'jane.doe@example.com',
  outstanding_balance: 150000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockInventory = [
  {
    id: 'inv_1',
    medicine: {
      name: 'Amoxicillin',
      generic_name: 'Amoxicillin 500mg',
    },
    quantity: 50,
    sell_price: 5000,
    batch_number: 'BATCH-001',
  },
  {
    id: 'inv_2',
    medicine: {
      name: 'Paracetamol',
      generic_name: 'Paracetamol 500mg',
    },
    quantity: 120,
    sell_price: 1000,
    batch_number: 'BATCH-002',
  },
];

export const mockData = {
  customer: mockCustomer,
  inventory: mockInventory,
  user: {
    name: 'Admin User',
    role: 'Pharmacist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  },
  tenant: {
    name: '40Labs Pharmacy',
    logo: '/logo.png',
    primaryColor: '#3b82f6',
    branding: {
      accent: '#6366f1',
      surface: '#ffffff',
    },
  },
  navigationSchema: [
    { label: 'Dashboard', icon: 'home', path: '/' },
    { label: 'Sales', icon: 'shopping-cart', path: '/sales' },
    { label: 'Inventory', icon: 'package', path: '/inventory' },
    { label: 'Customers', icon: 'users', path: '/customers' },
  ],
  cartPayload: {
    items: [
      { id: 'item_1', productId: 'inv_1', quantity: 2, price: 5000 },
      { id: 'item_2', productId: 'inv_2', quantity: 1, price: 1000 },
    ],
    total: 11000,
    customer_id: 'cust_123',
  },
};
