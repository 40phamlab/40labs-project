import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { useCustomersStore } from '../apps/core-desktop/src/stores/useCustomersStore.ts';

describe('Customers Store', () => {
  test('adds customer and updates notes', () => {
    const store = useCustomersStore.getState();

    const newCust = store.addCustomer({
      fullName: 'Juma Hassan',
      phone: '+255712345678',
      email: 'juma@example.com',
      notes: 'Prefers SMS reminders',
    });

    let state = useCustomersStore.getState();
    assert.equal(state.selectedCustomerId, newCust.id);
    assert.ok(state.customers.some((c) => c.id === newCust.id));

    store.updateCustomerNotes(newCust.id, 'Updated note: Chronic prescription');
    state = useCustomersStore.getState();
    const updatedCust = state.customers.find((c) => c.id === newCust.id);
    assert.equal(updatedCust?.notes, 'Updated note: Chronic prescription');
  });
});
