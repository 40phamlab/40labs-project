import { getDatabase } from './outbox';

export interface CacheResult<T = any> {
  data: T;
  storedAt: string;
  ageMs: number;
  asOfText: string;
}

export function initCacheDatabase(): void {
  try {
    const db = getDatabase();
    if (db && typeof db.execSync === 'function') {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS read_cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          stored_at TEXT NOT NULL
        );
      `);
    }
  } catch {
    // ignore
  }
}

export function putCache<T>(key: string, value: T): void {
  try {
    const db = getDatabase();
    if (!db || typeof db.runSync !== 'function') return;
    const storedAt = new Date().toISOString();
    const valueJson = JSON.stringify(value);
    db.runSync(
      `INSERT OR REPLACE INTO read_cache (key, value, stored_at) VALUES (?, ?, ?);`,
      [key, valueJson, storedAt]
    );
  } catch {
    // ignore
  }
}

export function getCache<T>(key: string): CacheResult<T> | null {
  try {
    const db = getDatabase();
    if (!db || typeof db.getFirstSync !== 'function') return null;
    const row = db.getFirstSync(`SELECT * FROM read_cache WHERE key = ?;`, [key]);
    if (!row) return null;

    const data = JSON.parse(row.value) as T;
    const storedAt = row.stored_at;
    const storedTime = new Date(storedAt).getTime();
    const now = Date.now();
    const ageMs = Math.max(0, now - storedTime);

    const date = new Date(storedAt);
    const asOfText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      data,
      storedAt,
      ageMs,
      asOfText,
    };
  } catch {
    return null;
  }
}

export function removeCache(key: string): void {
  try {
    const db = getDatabase();
    if (!db || typeof db.runSync !== 'function') return;
    db.runSync(`DELETE FROM read_cache WHERE key = ?;`, [key]);
  } catch {
    // ignore
  }
}

export function clearCache(): void {
  try {
    const db = getDatabase();
    if (!db || typeof db.runSync !== 'function') return;
    db.runSync(`DELETE FROM read_cache;`);
  } catch {
    // ignore
  }
}
