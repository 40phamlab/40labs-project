import type { PairedDevice } from '@40labs/types';
import { initialPairedDevices } from '../devData';

let devicesStore: PairedDevice[] = [...initialPairedDevices];

export const devicesApi = {
  list: async (): Promise<PairedDevice[]> => [...devicesStore],

  block: async (id: string): Promise<PairedDevice> => {
    const idx = devicesStore.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Device ${id} not found`);
    const updated: PairedDevice = {
      ...devicesStore[idx],
      status: 'blocked',
      updated_at: new Date().toISOString(),
    };
    devicesStore[idx] = updated;
    return updated;
  },

  unblock: async (id: string): Promise<PairedDevice> => {
    const idx = devicesStore.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Device ${id} not found`);
    const updated: PairedDevice = {
      ...devicesStore[idx],
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    devicesStore[idx] = updated;
    return updated;
  },

  remove: async (id: string): Promise<boolean> => {
    const idx = devicesStore.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Device ${id} not found`);
    devicesStore[idx] = {
      ...devicesStore[idx],
      status: 'removed',
      updated_at: new Date().toISOString(),
    };
    return true;
  },
};

export const devices = devicesApi;
