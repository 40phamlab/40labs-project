import { getDatabase, getNextPendingOutboxItem, updateOutboxItemStatus, enqueueOutboxItem, initOutboxDatabase } from '../db/outbox';
import { useConnectionStore } from '../stores/connection';
import { getServerCredential, listServerCredentials } from './secure-store';
import { ApiClient, ApiError } from '@40labs/api-client';

export type OutboxKind = 'stock_receipt' | 'lab_sample' | 'lab_result' | 'customer_create';

const ALLOWED_KINDS: OutboxKind[] = ['stock_receipt', 'lab_sample', 'lab_result', 'customer_create'];

let isFlushing = false;

export function initOutboxSystem() {
  initOutboxDatabase();
  const db = getDatabase();
  // Rule 9: Resume "sending" records after application restart
  db.runSync(`UPDATE outbox SET status = 'pending' WHERE status = 'sending';`);
}

export async function enqueue(kind: OutboxKind, payload: any): Promise<string> {
  if (!ALLOWED_KINDS.includes(kind)) {
    throw new Error(`Outbox kind '${kind}' is not allowed or rejected (sales cannot be queued).`);
  }

  const servers = await listServerCredentials();
  if (servers.length === 0) {
    throw new Error('No paired server available for outbox enqueue.');
  }

  const server = servers[0];
  const id = enqueueOutboxItem(server.businessId, kind, payload); // Rule 1, 2, 3: ID is Idempotency-Key generated once

  flush().catch(() => {});

  return id;
}

export async function flush(): Promise<void> {
  // Rule 8: Prevent concurrent flush operations
  if (isFlushing) return;
  const connectionState = useConnectionStore.getState().status;
  if (connectionState !== 'connected') return;

  isFlushing = true;

  try {
    while (true) {
      if (useConnectionStore.getState().status !== 'connected') break;

      // Rule 4: Oldest pending item first. Rule 5: One item at a time.
      const item = getNextPendingOutboxItem();
      if (!item) break;

      updateOutboxItemStatus(item.id, 'sending');

      const server = await getServerCredential(item.serverId);
      if (!server) {
        updateOutboxItemStatus(item.id, 'failed', 'Server credential not found');
        continue;
      }

      const client = new ApiClient({
        baseUrl: server.endpoint,
        transport: {
          request: async (opts) => {
            const response = await fetch(`${server.endpoint}${opts.path}`, {
              method: opts.method,
              headers: opts.headers,
              body: opts.body ? JSON.stringify(opts.body) : undefined,
              signal: opts.signal,
            });
            const data = await response.json().catch(() => ({}));
            return {
              status: response.status,
              headers: {},
              data,
            };
          },
        },
      });

      let path = '';
      switch (item.kind) {
        case 'stock_receipt':
          path = '/api/v1/stock/receipts';
          break;
        case 'lab_sample':
          path = '/api/v1/lab/samples';
          break;
        case 'lab_result':
          path = '/api/v1/lab/results';
          break;
        case 'customer_create':
          path = '/api/v1/customers';
          break;
        default:
          updateOutboxItemStatus(item.id, 'failed', `Unknown outbox kind: ${item.kind}`);
          continue;
      }

      try {
        // Rule 10: Always reuse original idempotency key
        await client.request({
          method: 'POST',
          path,
          headers: {
            'Idempotency-Key': item.id,
            Authorization: `Bearer ${server.credential}`,
          },
          body: JSON.parse(item.payloadJson),
        });

        const db = getDatabase();
        db.runSync(`DELETE FROM outbox WHERE id = ?;`, [item.id]);
      } catch (err: any) {
        if (err instanceof ApiError) {
          // Rule 7: Stop on 401/403 => revoked
          if (err.status === 401 || err.status === 403 || err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
            useConnectionStore.getState().setStatus('revoked');
            updateOutboxItemStatus(item.id, 'pending');
            break;
          }
          // Rule 6: Permanently fail appropriate 4xx errors (except 401/403)
          if (err.status >= 400 && err.status < 500) {
            updateOutboxItemStatus(item.id, 'failed', err.message);
            continue;
          }
        }

        // Rule 5: Retry transient failures (network errors, 5xx) with backoff + jitter
        const attempts = item.attempts + 1;
        const baseDelayMs = Math.min(1000 * Math.pow(2, attempts), 30000);
        const jitter = Math.random() * 1000;
        const retryDelay = baseDelayMs + jitter;

        const nextAttemptAt = new Date(Date.now() + retryDelay).toISOString();
        const db = getDatabase();
        db.runSync(
          `UPDATE outbox SET status = 'pending', attempts = ?, last_error = ?, next_attempt_at = ? WHERE id = ?;`,
          [attempts, err.message || 'Transient error', nextAttemptAt, item.id]
        );

        await new Promise((resolve) => setTimeout(resolve, Math.min(retryDelay, 2000)));
      }
    }
  } finally {
    isFlushing = false;
  }
}
