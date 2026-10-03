import { initCacheDatabase, putCache, getCache, removeCache, clearCache } from '../src/db/cache';
import * as SQLite from 'expo-sqlite';

describe('Offline Read Cache', () => {
  beforeEach(() => {
    // @ts-ignore
    if (SQLite.__clearMockMemory) {
      // @ts-ignore
      SQLite.__clearMockMemory();
    }
    initCacheDatabase();
  });

  it('persists and retrieves typed cache data with timestamps', () => {
    const testData = { sales: 1500, count: 5 };
    putCache('dashboard_summary', testData);

    const cached = getCache<typeof testData>('dashboard_summary');
    expect(cached).not.toBeNull();
    expect(cached?.data).toEqual(testData);
    expect(cached?.storedAt).toBeDefined();
    expect(cached?.ageMs).toBeGreaterThanOrEqual(0);
    expect(cached?.asOfText).toBeDefined();
  });

  it('replaces existing cache entry on put with same key', () => {
    putCache('config', { theme: 'dark' });
    putCache('config', { theme: 'light' });

    const cached = getCache<{ theme: string }>('config');
    expect(cached?.data.theme).toBe('light');
  });

  it('removes specific cache entry', () => {
    putCache('temp', 'data');
    expect(getCache('temp')).not.toBeNull();

    removeCache('temp');
    expect(getCache('temp')).toBeNull();
  });

  it('clears all cache entries', () => {
    putCache('key1', 'val1');
    putCache('key2', 'val2');

    expect(getCache('key1')).not.toBeNull();
    expect(getCache('key2')).not.toBeNull();

    clearCache();

    expect(getCache('key1')).toBeNull();
    expect(getCache('key2')).toBeNull();
  });
});
