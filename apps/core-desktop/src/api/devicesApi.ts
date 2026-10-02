import type { PairedDevice } from '@40labs/types';
import { initialPairedDevices } from '../devData';
import { isTauriAvailable, invokeCommand } from './client';

export interface PairingSessionInfo {
  sessionId: string;
  endpoint: string;
  expiresAt: string;
  qrPayload: string;
}

let devicesStore: PairedDevice[] = [...initialPairedDevices];

export const devicesApi = {
  list: async (): Promise<PairedDevice[]> => {
    if (isTauriAvailable()) {
      try {
        return await invokeCommand<PairedDevice[]>('get_paired_devices');
      } catch (err) {
        console.warn('Tauri get_paired_devices failed, falling back to mock memory store', err);
      }
    }
    return [...devicesStore];
  },

  initiatePairing: async (userId: string, permissions?: Record<string, boolean>): Promise<PairingSessionInfo> => {
    if (isTauriAvailable()) {
      try {
        return await invokeCommand<PairingSessionInfo>('initiate_pairing_session', { userId, permissions });
      } catch (err) {
        console.warn('Tauri initiate_pairing_session failed, generating mock session', err);
      }
    }
    const sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    const token = `tok_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return {
      sessionId,
      endpoint: 'http://192.168.1.100:4040',
      expiresAt,
      qrPayload: `orbit://pair?endpoint=http://192.168.1.100:4040&sessionId=${sessionId}&token=${token}`,
    };
  },

  updatePermissions: async (deviceId: string, permissions: Record<string, boolean>): Promise<void> => {
    if (isTauriAvailable()) {
      try {
        await invokeCommand('update_device_permissions', { payload: { deviceId, permissions } });
        return;
      } catch (err) {
        console.warn('Tauri update_device_permissions failed, updating mock store', err);
      }
    }
  },

  block: async (id: string): Promise<PairedDevice> => {
    if (isTauriAvailable()) {
      try {
        await invokeCommand('block_device', { id });
        const list = await invokeCommand<PairedDevice[]>('get_paired_devices');
        const found = list.find((d) => d.id === id);
        if (found) return found;
      } catch (err) {
        console.warn('Tauri block_device failed', err);
      }
    }
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
    if (isTauriAvailable()) {
      try {
        await invokeCommand('unblock_device', { id });
        const list = await invokeCommand<PairedDevice[]>('get_paired_devices');
        const found = list.find((d) => d.id === id);
        if (found) return found;
      } catch (err) {
        console.warn('Tauri unblock_device failed', err);
      }
    }
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
    if (isTauriAvailable()) {
      try {
        await invokeCommand('remove_device', { id });
        return true;
      } catch (err) {
        console.warn('Tauri remove_device failed', err);
      }
    }
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
