import { describe, test, expect } from 'vitest';
import { useInventoryStore } from '../apps/core-desktop/src/stores/useInventoryStore.ts';

describe('Inventory Store', () => {
  test('adds new inventory item', async () => {
    const store = useInventoryStore.getState();
    await store.loadItems();
    const initialCount = useInventoryStore.getState().items.length;

    await store.addItem({
      medicineName: 'Metformin 500mg',
      genericName: 'Metformin',
      category: 'Antidiabetic',
      unit: 'tablet',
      batchNumber: 'BATCH-MET-01',
      expiryDate: '2027-01-01T00:00:00.000Z',
      buyPrice: 500,
      sellPrice: 800,
      quantity: 100,
      lowStockThreshold: 20,
    });

    const state = useInventoryStore.getState();
    expect(state.items.length).toBe(initialCount + 1);
    const newItem = state.items[0];
    expect(newItem.medicine.name).toBe('Metformin 500mg');
    expect(newItem.quantity).toBe(100);
    expect(newItem.sell_price).toBe(800);
  });

  test('updates quantity and deletes item', async () => {
    const store = useInventoryStore.getState();
    await store.loadItems();
    const item = useInventoryStore.getState().items[0];
    expect(item).toBeDefined();

    const originalQty = item.quantity;
    await store.updateQuantity(item.id, 10);
    let state = useInventoryStore.getState();
    expect(state.items.find((i) => i.id === item.id)?.quantity).toBe(originalQty + 10);

    await store.deleteItem(item.id);
    state = useInventoryStore.getState();
    expect(state.items.find((i) => i.id === item.id)).toBeUndefined();
  });
});
