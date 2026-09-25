import type { User, PairedDevice } from '@40labs/types';
import { initialUsers, initialPairedDevices } from '../devData';

let usersStore: User[] = [...initialUsers];
let devicesStore: PairedDevice[] = [...initialPairedDevices];

export const usersApi = {
  list: (): User[] => [...usersStore],

  get: (id: string): User | null => {
    return usersStore.find((u) => u.id === id) || null;
  },

  listPairedDevices: (): PairedDevice[] => [...devicesStore],

  // Backwards compatibility aliases
  getUsers: (): User[] => usersApi.list(),
  getPairedDevices: (): PairedDevice[] => usersApi.listPairedDevices(),
};

export const users = usersApi;
