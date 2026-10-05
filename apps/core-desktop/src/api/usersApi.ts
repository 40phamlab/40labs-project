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
    const parts = payload.full_name.trim().split(' ');
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || 'Name';

    const newUser: User = {
      id: `user_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: payload.branch_id || BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      username: `user_${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      phone: payload.contacts || null,
      role: payload.role,
      role_preset: payload.role === 'sudo' ? 'sudo' : 'pharmacist',
      is_superintendent: false,
      active: true,
      owner_id: null,
      must_change_credentials: false,
      last_login_at: null,
      created_by_user_id: null,
      pin_hash: `mock_hash_${Date.now()}`,
      permissions: payload.role === 'sudo' ? null : payload.permissions,
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

  changePin: async (userId: string, _currentPin: string, newPin: string): Promise<boolean> => {
    const idx = usersStore.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error(`User ${userId} not found`);
    usersStore[idx] = {
      ...usersStore[idx],
      pin_hash: `mock_hash_${newPin}`,
      updated_at: new Date().toISOString(),
    };
    return true;
  },

  changePassword: async (userId: string, _currentPassword: string, _newPassword: string): Promise<boolean> => {
    const idx = usersStore.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error(`User ${userId} not found`);
    usersStore[idx] = {
      ...usersStore[idx],
      updated_at: new Date().toISOString(),
    };
    return true;
  },

  listPairedDevices: (): PairedDevice[] => [...devicesStore],

  // Backwards compatibility aliases
  getUsers: (): User[] => [...usersStore],
  getPairedDevices: (): PairedDevice[] => [...devicesStore],
};

export const users = usersApi;
