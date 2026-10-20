import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '../db/outbox';

export interface ServerCredential {
  businessId: string;
  businessName: string;
  endpoint: string;
  endpoints?: string[];
  credential: string;
  fp: string;
}

const STORAGE_KEY_PREFIX = 'orbit_server_';
const SERVERS_INDEX_KEY = 'orbit_servers_index';

function initFallbackDb() {
  try {
    const db = getDatabase();
    if (db && typeof db.execSync === 'function') {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS secure_store_fallback (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    }
  } catch {}
}

const fallbackMemoryStore = new Map<string, string>();

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err: any) {
    initFallbackDb();
    const db = getDatabase();
    if (db && typeof db.runSync === 'function') {
      try {
        db.runSync(`INSERT OR REPLACE INTO secure_store_fallback (key, value) VALUES (?, ?);`, [key, value]);
        return;
      } catch {}
    }
    fallbackMemoryStore.set(key, value);
  }
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err: any) {
    initFallbackDb();
    const db = getDatabase();
    if (db && typeof db.getFirstSync === 'function') {
      try {
        const row = db.getFirstSync(`SELECT value FROM secure_store_fallback WHERE key = ?;`, [key]);
        if (row && row.value) return row.value;
      } catch {}
    }
    return fallbackMemoryStore.get(key) || null;
  }
}

async function safeDeleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err: any) {
    initFallbackDb();
    const db = getDatabase();
    if (db && typeof db.runSync === 'function') {
      try {
        db.runSync(`DELETE FROM secure_store_fallback WHERE key = ?;`, [key]);
      } catch {}
    }
    fallbackMemoryStore.delete(key);
  }
}

export async function saveServerCredential(cred: ServerCredential): Promise<void> {
  if (!cred.businessId || !cred.endpoint || !cred.credential || !cred.fp) {
    throw new Error('Missing required credential fields');
  }

  const key = `${STORAGE_KEY_PREFIX}${cred.businessId}`;
  const normalizedCredential = {
    ...cred,
    endpoints: cred.endpoints?.length ? cred.endpoints : [cred.endpoint],
  };
  await safeSetItem(key, JSON.stringify(normalizedCredential));

  const indexStr = await safeGetItem(SERVERS_INDEX_KEY);
  const index: string[] = indexStr ? JSON.parse(indexStr) : [];
  if (!index.includes(cred.businessId)) {
    index.push(cred.businessId);
    await safeSetItem(SERVERS_INDEX_KEY, JSON.stringify(index));
  }
}

export async function getServerCredential(businessId: string): Promise<ServerCredential | null> {
  const key = `${STORAGE_KEY_PREFIX}${businessId}`;
  const data = await safeGetItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as ServerCredential;
  } catch {
    return null;
  }
}

export async function listServerCredentials(): Promise<ServerCredential[]> {
  const indexStr = await safeGetItem(SERVERS_INDEX_KEY);
  if (!indexStr) return [];
  try {
    const index: string[] = JSON.parse(indexStr);
    const credentials: ServerCredential[] = [];
    for (const businessId of index) {
      const cred = await getServerCredential(businessId);
      if (cred) {
        credentials.push(cred);
      }
    }
    return credentials;
  } catch {
    return [];
  }
}

export async function removeServerCredential(businessId: string): Promise<void> {
  const key = `${STORAGE_KEY_PREFIX}${businessId}`;
  await safeDeleteItem(key);

  const indexStr = await safeGetItem(SERVERS_INDEX_KEY);
  if (indexStr) {
    try {
      const index: string[] = JSON.parse(indexStr);
      const newIndex = index.filter((id) => id !== businessId);
      await safeSetItem(SERVERS_INDEX_KEY, JSON.stringify(index));
    } catch {
      // ignore
    }
  }
}
