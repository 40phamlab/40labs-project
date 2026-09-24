import { create } from 'zustand';
import type { Customer, MedicineWithInventory, Sale, SaleLine } from '@40labs/types';
import { mockSales, WORKSPACE_ID, BRANCH_ID } from '../lib/mockData.ts';

export interface CartItem {
  inventoryItem: MedicineWithInventory;
  quantity: number;
  unitPrice: number;
}

interface SalesState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount: number;
  completedSales: Sale[];

  // Cart actions
  addToCart: (item: MedicineWithInventory) => void;
  removeFromCart: (inventoryItemId: string) => void;
  updateQuantity: (inventoryItemId: string, quantity: number) => void;
  clearCart: () => void;

  // Checkout actions
  setSelectedCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: 'cash' | 'mobile_money' | 'card' | 'credit') => void;
  setDiscountAmount: (amount: number) => void;
  checkout: () => Sale | null;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  paymentMethod: 'cash',
  discountAmount: 0,
  completedSales: mockSales,

  addToCart: (item) => set((state) => {
    const existingIndex = state.cart.findIndex(
      (c) => c.inventoryItem.id === item.id
    );
    if (existingIndex > -1) {
      const updatedCart = [...state.cart];
      updatedCart[existingIndex].quantity += 1;
      return { cart: updatedCart };
    }
    return {
      cart: [...state.cart, { inventoryItem: item, quantity: 1, unitPrice: item.sell_price }],
    };
  }),

  removeFromCart: (inventoryItemId) => set((state) => ({
    cart: state.cart.filter((c) => c.inventoryItem.id !== inventoryItemId),
  })),

  updateQuantity: (inventoryItemId, quantity) => set((state) => ({
    cart: state.cart
      .map((c) => (c.inventoryItem.id === inventoryItemId ? { ...c, quantity: Math.max(0, quantity) } : c))
      .filter((c) => c.quantity > 0),
  })),

  clearCart: () => set({ cart: [], discountAmount: 0, selectedCustomer: null }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setDiscountAmount: (discountAmount) => set({ discountAmount }),

  checkout: () => {
    const { cart, selectedCustomer, paymentMethod, discountAmount, completedSales } = get();
    if (cart.length === 0) return null;

    const now = new Date().toISOString();
    const saleId = `sale_${Date.now()}`;

    const lines: SaleLine[] = cart.map((item, index) => ({
      id: `saleline_${Date.now()}_${index}`,
      inventory_item_id: item.inventoryItem.id,
      medicine_id: item.inventoryItem.medicine_id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      dispensed_by_user_id: 'user_001',
      is_prescription_dispense: item.inventoryItem.medicine.requires_prescription,
    }));

    const subtotal = lines.reduce((acc, line) => acc + line.subtotal, 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const newSale: Sale = {
      id: saleId,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      customer_id: selectedCustomer ? selectedCustomer.id : null,
      lines,
      payment_method: paymentMethod,
      discount_amount: discountAmount,
      discount_authorized_by_user_id: discountAmount > 0 ? 'user_001' : null,
      tax_amount: 0,
      grand_total: grandTotal,
      currency: 'TZS',
      synced_at: null,
    };

    set({
      completedSales: [newSale, ...completedSales],
      cart: [],
      selectedCustomer: null,
      discountAmount: 0,
    });

    return newSale;
  },
}));
