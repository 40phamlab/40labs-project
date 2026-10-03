import { getDatabase } from './outbox';

export interface CacheResult<T = any> {
  data: T;
  storedAt: string;
  ageMs: number;
  asOfText: string;
}

export function initCacheDatabase(): void {
  const db = getDatabase();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS read_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      stored_at TEXT NOT NULL
    );
  `);
}

export function putCache<T>(key: string, value: T): void {
  const db = getDatabase();
  const storedAt = new Date().toISOString();
  const valueJson = JSON.stringify(value);
  db.runSync(
    `INSERT OR REPLACE INTO read_cache (key, value, stored_at) VALUES (?, ?, ?);`,
    [key, valueJson, storedAt]
  );
}

export function getCache<T>(key: string): CacheResult<T> | null {
  const db = getDatabase();
  const row = db.getFirstSync(`SELECT * FROM read_cache WHERE key = ?;`, [key]);
  if (!row) return null;

  try {
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
  const db = getDatabase();
  db.runSync(`DELETE FROM read_cache WHERE key = ?;`, [key]);
}

export function clearCache(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM read_cache;`);
}
