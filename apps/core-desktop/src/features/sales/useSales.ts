// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/sales-pos.md]
// Zustand for local draft state (Zustand-vs-React-Query rule in 01-ARCHITECTURE.md)
// React Query for server/persisted state (mockSales).

import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import type { Sale, SaleLine, PaymentMethod } from '@40labs/types';
import { mockSales, mockInventoryItems } from '../../lib/mockData';

interface SaleCartState {
  lines: SaleLine[];
  customer_id: string | null;
  payment_method: PaymentMethod;
  discount_amount: number;

  // Actions
  /**
   * Adds a line to the cart.
   * Reads sell_price from inventory source of truth to prevent price drift.
   */
  addLine: (inventoryItemId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  setCustomer: (id: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscountAmount: (amount: number) => void;
  reset: () => void;
}

export const useSaleCart = create<SaleCartState>((set, get) => ({
  lines: [],
  customer_id: null,
  payment_method: 'cash',
  discount_amount: 0,

  addLine: (inventoryItemId, qty) => {
    // Prevent fraud/drift by reading price from the source of truth, not the caller.
    const item = mockInventoryItems.find((i) => i.id === inventoryItemId);
    if (!item) {
      console.warn(`Attempted to add non-existent inventory item: ${inventoryItemId}`);
      return;
    }

    const { lines } = get();
    const existingLine = lines.find((l) => l.inventory_item_id === inventoryItemId);

    if (existingLine) {
      const newQty = existingLine.quantity + qty;
      set({
        lines: lines.map((l) =>
          l.inventory_item_id === inventoryItemId
            ? { ...l, quantity: newQty, subtotal: newQty * l.unit_price }
            : l
        ),
      });
    } else {
      const newLine: SaleLine = {
        id: `line_${Math.random().toString(36).slice(2, 9)}`,
        inventory_item_id: item.id,
        medicine_id: item.medicine_id,
        quantity: qty,
        unit_price: item.sell_price,
        subtotal: qty * item.sell_price,
        dispensed_by_user_id: 'user_001', // MVP: Default to sudo user until auth session hook exists
        is_prescription_dispense: false, // Default to OTC; POS UI can toggle if needed
      };
      set({ lines: [...lines, newLine] });
    }
  },

  removeLine: (lineId) => {
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== lineId),
    }));
  },

  setQty: (lineId, qty) => {
    if (qty <= 0) {
      get().removeLine(lineId);
      return;
    }
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === lineId ? { ...l, quantity: qty, subtotal: qty * l.unit_price } : l
      ),
    }));
  },

  setCustomer: (id) => set({ customer_id: id }),
  setPaymentMethod: (method) => set({ payment_method: method }),
  setDiscountAmount: (amount) => set({ discount_amount: amount }),
  reset: () => set({
    lines: [],
    customer_id: null,
    payment_method: 'cash',
    discount_amount: 0
  }),
}));

/**
 * Hook to fetch historical sales records.
 * Read-only from mock data for MVP.
 */
export const useSalesHistory = () => {
  return useQuery<Sale[]>({
    queryKey: ['sales', 'history'],
    queryFn: async () => {
      // Simulation of async fetch
      return [...mockSales].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
};
