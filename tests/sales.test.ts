import { describe, test, expect } from 'vitest';
import { useSalesStore } from '../apps/core-desktop/src/stores/useSalesStore.ts';
import type { MedicineWithInventory } from '@40labs/types';

const sampleItem: MedicineWithInventory = {
  id: 'inv_test_01',
  workspace_id: 'ws_test',
  branch_id: 'br_test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  medicine_id: 'med_test_01',
  batch_number: 'BATCH-001',
  expiry_date: '2026-12-31T00:00:00.000Z',
  buy_price: 1000,
  sell_price: 1500,
  quantity: 50,
  low_stock_threshold: 10,
  cold_chain_required: false,
  medicine: {
    id: 'med_test_01',
    workspace_id: 'ws_test',
    branch_id: 'br_test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: 'Amoxicillin 500mg',
    generic_name: 'Amoxicillin',
    category: 'Antibiotics',
    unit: 'capsule',
    is_controlled_substance: false,
    requires_prescription: true,
  },
};

describe('Sales Store', () => {
  test('adds item to cart and calculates subtotal', () => {
    const store = useSalesStore.getState();
    store.clearCart();

    store.addToCart(sampleItem);
    let state = useSalesStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0].quantity).toBe(1);
    expect(state.cart[0].unitPrice).toBe(1500);

    // Add again to increment quantity
    store.addToCart(sampleItem);
    state = useSalesStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0].quantity).toBe(2);
  });

  test('updates quantity and removes item when quantity is 0', () => {
    const store = useSalesStore.getState();
    store.clearCart();
    store.addToCart(sampleItem);

    store.updateQuantity(sampleItem.id, 5);
    let state = useSalesStore.getState();
    expect(state.cart[0].quantity).toBe(5);

    store.updateQuantity(sampleItem.id, 0);
    state = useSalesStore.getState();
    expect(state.cart.length).toBe(0);
  });

  test('performs checkout and clears cart', async () => {
    const store = useSalesStore.getState();
    store.clearCart();
    store.addToCart(sampleItem);
    store.setDiscountAmount(500);

    const completedSale = await store.checkout();
    expect(completedSale).not.toBeNull();
    expect(completedSale?.grand_total).toBe(1000); // 1500 - 500 discount

    const state = useSalesStore.getState();
    expect(state.cart.length).toBe(0);
    expect(state.discountAmount).toBe(0);
  });
});
