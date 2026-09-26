import { describe, test, expect } from 'vitest';
import { useCustomersStore } from '../apps/core-desktop/src/stores/useCustomersStore.ts';

describe('Customers Store', () => {
  test('adds customer and updates notes', async () => {
    const store = useCustomersStore.getState();

    const newCust = await store.addCustomer({
      fullName: 'Juma Hassan',
      phone: '+255712345678',
      email: 'juma@example.com',
      notes: 'Prefers SMS reminders',
    });

    let state = useCustomersStore.getState();
    expect(state.selectedCustomerId).toBe(newCust.id);
    expect(state.customers.some((c) => c.id === newCust.id)).toBe(true);

    await store.updateCustomerNotes(newCust.id, 'Updated note: Chronic prescription');
    state = useCustomersStore.getState();
    const updatedCust = state.customers.find((c) => c.id === newCust.id);
    expect(updatedCust?.notes).toBe('Updated note: Chronic prescription');
  });
});
