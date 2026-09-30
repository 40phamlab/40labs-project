import type { User, PairedDevice, UserRole, StaffPermissionSet } from '@40labs/types';
import { initialUsers, initialPairedDevices } from '../devData';
import { WORKSPACE_ID, BRANCH_ID } from '../devData/constants';

export interface CreateUserPayload {
  full_name: string;
  contacts: string | null;
  location: string | null;
  role: UserRole;
  pin: string;
  branch_id: string;
  permissions: StaffPermissionSet | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  contacts?: string | null;
  location?: string | null;
  role?: UserRole;
  branch_id?: string;
  permissions?: StaffPermissionSet | null;
  active?: boolean;
}

let usersStore: User[] = [...initialUsers];
let devicesStore: PairedDevice[] = [...initialPairedDevices];

export const usersApi = {
  list: async (): Promise<User[]> => [...usersStore],

  get: async (id: string): Promise<User | null> => {
    return usersStore.find((u) => u.id === id) || null;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: payload.branch_id || BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: payload.full_name,
      role: payload.role,
      pin_hash: `mock_hash_${Date.now()}`,
      permissions: payload.role === 'sudo' ? null : payload.permissions,
      active: true,
      contacts: payload.contacts,
      location: payload.location,
    };
    usersStore.push(newUser);
    return newUser;
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    const existing = usersStore[index];
    const updated: User = {
      ...existing,
      ...payload,
      permissions: payload.role === 'sudo' ? null : (payload.permissions !== undefined ? payload.permissions : existing.permissions),
      updated_at: new Date().toISOString(),
    };
    usersStore[index] = updated;
    return updated;
  },

  updatePermissions: async (id: string, permissions: StaffPermissionSet | null): Promise<User> => {
    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: User = {
      ...usersStore[index],
      permissions,
      updated_at: new Date().toISOString(),
    };
    usersStore[index] = updated;
    return updated;
  },

  deactivate: async (id: string): Promise<User> => {
    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: User = {
      ...usersStore[index],
      active: !usersStore[index].active,
      updated_at: new Date().toISOString(),
    };
    usersStore[index] = updated;
    return updated;
  },

  listPairedDevices: (): PairedDevice[] => [...devicesStore],

  // Backwards compatibility aliases
  getUsers: (): User[] => [...usersStore],
  getPairedDevices: (): PairedDevice[] => [...devicesStore],
};

export const users = usersApi;
