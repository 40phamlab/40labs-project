// COPIED FROM: apps/core-desktop/src/stores/useConnectivityStore.ts
import { create } from 'zustand';

export type ConnectivityState = 'online' | 'offline';

interface ConnectivityStore {
  status: ConnectivityState;
  setStatus: (status: ConnectivityState) => void;
}

export const useConnectivityStore = create<ConnectivityStore>((set) => ({
  status: 'online',
  setStatus: (status) => set({ status }),
}));
