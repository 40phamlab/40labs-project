import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useConnectivityStore } from '../useConnectivityStore';

describe('useConnectivityStore (Network Interface State)', () => {
  beforeEach(() => {
    useConnectivityStore.setState({ status: 'online' });
  });

  test('initializes correctly and supports swappable source function', () => {
    const store = useConnectivityStore.getState();
    expect(store.status).toBe('online');

    // Swap source function to simulate offline
    store.setSourceFn(() => false);
    store.checkConnectivity();
    expect(useConnectivityStore.getState().status).toBe('offline');

    // Swap back to online
    store.setSourceFn(() => true);
    store.checkConnectivity();
    expect(useConnectivityStore.getState().status).toBe('online');
  });

  test('debounces rapid updates', async () => {
    vi.useFakeTimers();
    const store = useConnectivityStore.getState();

    // Simulate window network event
    store.setSourceFn(() => false);
    window.dispatchEvent(new Event('offline'));

    // Status is still 'online' immediately after event dispatch due to 500ms debounce
    expect(useConnectivityStore.getState().status).toBe('online');

    // Advance time by 499ms - still 'online'
    vi.advanceTimersByTime(499);
    expect(useConnectivityStore.getState().status).toBe('online');

    // Advance past 500ms threshold - now updated to 'offline'
    vi.advanceTimersByTime(2);
    expect(useConnectivityStore.getState().status).toBe('offline');

    vi.useRealTimers();
  });
});
