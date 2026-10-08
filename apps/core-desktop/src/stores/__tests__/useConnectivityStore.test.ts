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

    store.setSourceFn(() => false);
    store.checkConnectivity(); // triggers check
    expect(useConnectivityStore.getState().status).toBe('online'); // not updated immediately if event listener debounced

    vi.useRealTimers();
  });
});
