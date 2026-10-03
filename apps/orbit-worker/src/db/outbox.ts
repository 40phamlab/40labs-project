import * as SQLite from 'expo-sqlite';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface OutboxItem {
  id: string;
  serverId: string;
  kind: string;
  payloadJson: string;
  createdAt: string;
  status: 'pending' | 'sending' | 'failed';
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
}

let dbInstance: any = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('orbit_worker.db');
  }
  return dbInstance;
}

export function initOutboxDatabase(): void {
  const db = getDatabase();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_attempt_at TEXT
    );
  `);
}

export function enqueueOutboxItem(serverId: string, kind: string, payload: any, customId?: string): string {
  const db = getDatabase();
  const id = customId || generateUuid(); // Rule 1, 2, 3: ID is Idempotency-Key generated exactly once, never regenerated.
  const createdAt = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);

  db.runSync(
    `INSERT INTO outbox (id, server_id, kind, payload_json, created_at, status, attempts) VALUES (?, ?, ?, ?, ?, 'pending', 0);`,
    [id, serverId, kind, payloadJson, createdAt]
  );

  return id;
}

export function getNextPendingOutboxItem(): OutboxItem | null {
  const db = getDatabase();
  // Rule 4: Oldest pending item first. Rule 5: One item at a time.
  const row = db.getFirstSync(
    `SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1;`
  );

  if (!row) return null;

  return {
    id: row.id,
    serverId: row.server_id,
    kind: row.kind,
    payloadJson: row.payload_json,
    createdAt: row.created_at,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    nextAttemptAt: row.next_attempt_at,
  };
}

export function updateOutboxItemStatus(
  id: string,
  status: 'pending' | 'sending' | 'failed',
  lastError?: string
): void {
  const db = getDatabase();
  if (status === 'failed') {
    db.runSync(
      `UPDATE outbox SET status = ?, last_error = ? WHERE id = ?;`,
      [status, lastError || null, id]
    );
  } else {
    db.runSync(
      `UPDATE outbox SET status = ? WHERE id = ?;`,
      [status, id]
    );
  }
}
