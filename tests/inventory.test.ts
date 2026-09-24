import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { useInventoryStore } from '../apps/core-desktop/src/stores/useInventoryStore.ts';

describe('Inventory Store', () => {
  test('adds new inventory item', () => {
    const store = useInventoryStore.getState();
    const initialCount = store.items.length;

    store.addItem({
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
    assert.equal(state.items.length, initialCount + 1);
    const newItem = state.items[0];
    assert.equal(newItem.medicine.name, 'Metformin 500mg');
    assert.equal(newItem.quantity, 100);
    assert.equal(newItem.sell_price, 800);
  });

  test('updates quantity and deletes item', () => {
    const store = useInventoryStore.getState();
    const item = store.items[0];
    assert.ok(item);

    const originalQty = item.quantity;
    store.updateQuantity(item.id, 10);
    let state = useInventoryStore.getState();
    assert.equal(state.items.find((i) => i.id === item.id)?.quantity, originalQty + 10);

    store.deleteItem(item.id);
    state = useInventoryStore.getState();
    assert.equal(state.items.find((i) => i.id === item.id), undefined);
  });
});
