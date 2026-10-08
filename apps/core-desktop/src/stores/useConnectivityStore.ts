import { create } from 'zustand';

export type ConnectivityState = 'online' | 'offline';

/**
 * Swappable source function evaluating network-interface state.
 * NOTE: This represents network-interface state (navigator.onLine / window online/offline events),
 * NOT confirmed internet reachability.
 *
 * TODO: replace source with sync-engine reachability [Phase: sync]
 */
export type ConnectivitySourceFn = () => boolean;

const defaultConnectivitySource: ConnectivitySourceFn = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

interface ConnectivityStore {
  status: ConnectivityState;
  setStatus: (status: ConnectivityState) => void;
  sourceFn: ConnectivitySourceFn;
  setSourceFn: (fn: ConnectivitySourceFn) => void;
  checkConnectivity: () => void;
}

export const useConnectivityStore = create<ConnectivityStore>((set, get) => ({
  status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online',
  sourceFn: defaultConnectivitySource,
  setStatus: (status) => set({ status }),
  setSourceFn: (sourceFn) => set({ sourceFn }),
  checkConnectivity: () => {
    const { sourceFn } = get();
    const isOnline = sourceFn();
    const newStatus: ConnectivityState = isOnline ? 'online' : 'offline';
    if (get().status !== newStatus) {
      set({ status: newStatus });
    }
  },
}));

// Setup global network event listeners with 500ms debounce
if (typeof window !== 'undefined') {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handleNetworkChange = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      useConnectivityStore.getState().checkConnectivity();
    }, 500);
  };

  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
}
