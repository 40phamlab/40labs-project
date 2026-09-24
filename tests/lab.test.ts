import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { useLabStore } from '../apps/core-desktop/src/stores/useLabStore.ts';

describe('Lab Store', () => {
  test('creates lab order and transitions status through sample collection and result entry', () => {
    const store = useLabStore.getState();

    const order = store.createOrder('cust_001', 'test_001');
    assert.equal(order.status, 'pending');

    let state = useLabStore.getState();
    assert.ok(state.orders.some((o) => o.id === order.id));

    const sample = store.collectSample(order.id, 'SAMPLE-LAB-01');
    assert.equal(sample.sample_label, 'SAMPLE-LAB-01');

    state = useLabStore.getState();
    const updatedOrder = state.orders.find((o) => o.id === order.id);
    assert.equal(updatedOrder?.status, 'sample_collected');

    const result = store.enterResult(order.id, '12.5 g/dL', '12.0 - 16.0 g/dL', false);
    assert.equal(result.is_out_of_range, false);

    state = useLabStore.getState();
    const finalOrder = state.orders.find((o) => o.id === order.id);
    assert.equal(finalOrder?.status, 'report_ready');
  });
});
