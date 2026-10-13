import { describe, test, expect } from 'vitest';
import { useLabStore } from '../apps/core-desktop/src/stores/useLabStore.ts';

describe('Lab Store', () => {
  test('creates lab order and transitions status through sample collection and result entry', async () => {
    const store = useLabStore.getState();

    const order = await store.createOrder('cust_001', 'test_001');
    expect(order.status).toBe('pending');

    let state = useLabStore.getState();
    expect(state.orders.some((o) => o.id === order.id)).toBe(true);

    const sample = await store.collectSample(order.id, 'SAMPLE-LAB-01');
    expect(sample.sample_label).toBe('SAMPLE-LAB-01');

    state = useLabStore.getState();
    const updatedOrder = state.orders.find((o) => o.id === order.id);
    expect(updatedOrder?.status).toBe('sample_collected');

    const result = await store.enterResult(order.id, '12.5 g/dL', '12.0 - 16.0 g/dL', false);
    expect(result.is_out_of_range).toBe(false);

    state = useLabStore.getState();
    const finalOrder = state.orders.find((o) => o.id === order.id);
    expect(finalOrder?.status).toBe('report_ready');
  });
});
