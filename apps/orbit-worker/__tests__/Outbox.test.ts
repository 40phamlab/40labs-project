import { initOutboxDatabase, enqueueOutboxItem, getNextPendingOutboxItem, updateOutboxItemStatus, listOutboxItems } from '../src/db/outbox';
import { initOutboxSystem } from '../src/lib/outbox-sync';
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
    const pendingAfterSending = getNextPendingOutboxItem();
    expect(pendingAfterSending).toBeNull();

    updateOutboxItemStatus(id, 'failed', 'Network timeout');
    updateOutboxItemStatus(id, 'pending');

    const retriedItem = getNextPendingOutboxItem();
    expect(retriedItem?.id).toBe(id);
    expect(retriedItem?.status).toBe('pending');
  });

  it('honors next_attempt_at backoff schedule', () => {
    const id = enqueueOutboxItem('server-1', 'customer_create', { name: 'Test' });
    const futureTime = new Date(Date.now() + 600000).toISOString();
    updateOutboxItemStatus(id, 'pending', 'Transient', futureTime, 1);

    // Should not return item because next_attempt_at is in the future
    const next = getNextPendingOutboxItem();
    expect(next).toBeNull();

    // Past next_attempt_at should return item
    const pastTime = new Date(Date.now() - 1000).toISOString();
    updateOutboxItemStatus(id, 'pending', 'Transient', pastTime, 1);
    const ready = getNextPendingOutboxItem();
    expect(ready?.id).toBe(id);
  });

  it('resumes sending items to pending on initOutboxSystem', () => {
    const id = enqueueOutboxItem('server-1', 'stock_receipt', { item: 'C' });
    updateOutboxItemStatus(id, 'sending');

    initOutboxSystem();
    const item = getNextPendingOutboxItem();
    expect(item?.id).toBe(id);
    expect(item?.status).toBe('pending');
  });
});
