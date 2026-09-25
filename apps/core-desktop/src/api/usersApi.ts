import type { User, PairedDevice } from '@40labs/types';
import { initialUsers, initialPairedDevices } from '../devData';

let usersStore: User[] = [...initialUsers];
let devicesStore: PairedDevice[] = [...initialPairedDevices];

export const usersApi = {
  getUsers: (): User[] => [...usersStore],

  getPairedDevices: (): PairedDevice[] => [...devicesStore],
};
