import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useNavStore navigation persistence and validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores correctly when a valid persisted screen is present', async () => {
    localStorage.setItem('40labs_sidebar_section', 'sales');
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('sales');
  });

  it('falls back to default screen when an invalid persisted screen is present', async () => {
    localStorage.setItem('40labs_sidebar_section', 'old-screen-that-no-longer-exists');
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('settings');
  });

  it('falls back to default screen when persisted screen is missing', async () => {
    const { useNavStore } = await import('./useNavStore');
    expect(useNavStore.getState().activeScreen).toBe('settings');
  });

  it('persists correctly upon navigation to a valid screen', async () => {
    const { useNavStore } = await import('./useNavStore');
    useNavStore.getState().setActiveScreen('reports');
    expect(useNavStore.getState().activeScreen).toBe('reports');
    expect(localStorage.getItem('40labs_sidebar_section')).toBe('reports');
  });

  it('restores valid screen correctly on application reload', async () => {
    localStorage.setItem('40labs_sidebar_section', 'customers');
    const { useNavStore: firstLoadStore } = await import('./useNavStore');
    expect(firstLoadStore.getState().activeScreen).toBe('customers');

    // Simulate reload by resetting modules and re-importing store
    vi.resetModules();
    const { useNavStore: reloadStore } = await import('./useNavStore');
    expect(reloadStore.getState().activeScreen).toBe('customers');
  });
});
