import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

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
    if (Platform.OS === 'web') {
      dbInstance = {
        execSync: () => {},
        runSync: () => {},
        getFirstSync: () => null,
        getAllSync: () => [],
      };
    } else {
      try {
        dbInstance = SQLite.openDatabaseSync('orbit_worker.db');
      } catch (err) {
        if (__DEV__) {
          console.warn('[OrbitWorker] Failed to open SQLite database, falling back to memory stub:', err);
        }
        dbInstance = {
          execSync: () => {},
          runSync: () => {},
          getFirstSync: () => null,
          getAllSync: () => [],
        };
      }
    }
  }
  return dbInstance;
}

export function initOutboxDatabase(): void {
  const db = getDatabase();
  if (db && typeof db.execSync === 'function') {
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
    try { db.execSync(`ALTER TABLE outbox ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;`); } catch {}
    try { db.execSync(`ALTER TABLE outbox ADD COLUMN last_error TEXT;`); } catch {}
    try { db.execSync(`ALTER TABLE outbox ADD COLUMN next_attempt_at TEXT;`); } catch {}
  }
}

export function enqueueOutboxItem(serverId: string, kind: string, payload: any, customId?: string): string {
  const db = getDatabase();
  const id = customId || generateUuid();
  const createdAt = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);

  if (db && typeof db.runSync === 'function') {
    db.runSync(
      `INSERT INTO outbox (id, server_id, kind, payload_json, created_at, status, attempts) VALUES (?, ?, ?, ?, ?, 'pending', 0);`,
      [id, serverId, kind, payloadJson, createdAt]
    );
  } else {
    throw new Error('Database not available for outbox persistence');
  }

  return id;
}

export function getNextPendingOutboxItem(): OutboxItem | null {
  try {
    const db = getDatabase();
    if (!db || typeof db.getFirstSync !== 'function') return null;
    const row = db.getFirstSync(
      `SELECT * FROM outbox WHERE status = 'pending' AND (next_attempt_at IS NULL OR datetime(next_attempt_at) <= datetime('now')) ORDER BY created_at ASC LIMIT 1;`
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
  } catch {
    return null;
  }
}

export function listOutboxItems(): OutboxItem[] {
  try {
    const db = getDatabase();
    if (!db || typeof db.getAllSync !== 'function') return [];
    const rows = db.getAllSync(`SELECT * FROM outbox ORDER BY created_at DESC;`);
    return (rows || []).map((row: any) => ({
      id: row.id,
      serverId: row.server_id,
      kind: row.kind,
      payloadJson: row.payload_json,
      createdAt: row.created_at,
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
      nextAttemptAt: row.next_attempt_at,
    }));
  } catch {
    return [];
  }
}

export function updateOutboxItemStatus(
  id: string,
  status: 'pending' | 'sending' | 'failed',
  lastError?: string,
  nextAttemptAt?: string,
  attempts?: number
): void {
  const db = getDatabase();
  if (!db || typeof db.runSync !== 'function') return;

  if (nextAttemptAt !== undefined || attempts !== undefined) {
    db.runSync(
      `UPDATE outbox SET status = ?, last_error = ?, next_attempt_at = ?, attempts = COALESCE(?, attempts) WHERE id = ?;`,
      [status, lastError || null, nextAttemptAt || null, attempts ?? null, id]
    );
  } else if (lastError !== undefined) {
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

export function retryOutboxItem(id: string): void {
  const db = getDatabase();
  if (!db || typeof db.runSync !== 'function') return;
  db.runSync(
    `UPDATE outbox SET status = 'pending', next_attempt_at = NULL, last_error = NULL WHERE id = ?;`,
    [id]
  );
}

export function discardOutboxItem(id: string): void {
  const db = getDatabase();
  if (!db || typeof db.runSync !== 'function') return;
  db.runSync(`DELETE FROM outbox WHERE id = ?;`, [id]);
}
