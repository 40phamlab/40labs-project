import { initOutboxDatabase, enqueueOutboxItem, getNextPendingOutboxItem, updateOutboxItemStatus } from '../src/db/outbox';
import * as SQLite from 'expo-sqlite';

describe('Outbox Database & Queue', () => {
  beforeEach(() => {
    // @ts-ignore
    if (SQLite.__clearMockMemory) {
      // @ts-ignore
      SQLite.__clearMockMemory();
    }
    initOutboxDatabase();
  });

  it('inserts and retrieves oldest pending item first', () => {
    const id1 = enqueueOutboxItem('server-1', 'stock_receipt', { item: 'A' });
    const id2 = enqueueOutboxItem('server-1', 'stock_receipt', { item: 'B' });

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toEqual(id2);

    const nextItem = getNextPendingOutboxItem();
    expect(nextItem).not.toBeNull();
    expect(nextItem?.id).toBe(id1);
    expect(JSON.parse(nextItem!.payloadJson)).toEqual({ item: 'A' });
  });

  it('updates item status correctly', () => {
    const id = enqueueOutboxItem('server-1', 'lab_sample', { sampleId: '123' });

    let item = getNextPendingOutboxItem();
    expect(item?.status).toBe('pending');

    updateOutboxItemStatus(id, 'sending');
    // Once sending, getNextPendingOutboxItem shouldn't return it as pending
    const pendingAfterSending = getNextPendingOutboxItem();
    expect(pendingAfterSending).toBeNull();

    updateOutboxItemStatus(id, 'failed', 'Network timeout');
    // We can update back to pending for retry without regenerating ID (Idempotency-Key persistence rule)
    updateOutboxItemStatus(id, 'pending');

    const retriedItem = getNextPendingOutboxItem();
    expect(retriedItem?.id).toBe(id);
    expect(retriedItem?.status).toBe('pending');
  });
});
