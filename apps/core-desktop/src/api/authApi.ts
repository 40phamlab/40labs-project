import { invoke } from '@tauri-apps/api/core';
import type { Business } from '@40labs/types';

export interface AuthStatusResponse {
  deviceBound: boolean;
  business: Business | null;
  session: {
    userId: string;
    role: string;
    locked: boolean;
  } | null;
}

export interface AuthErrorResponse {
  code: string;
  retryAfterSecs?: number | null;
}

export const authApi = {
  status: async (): Promise<AuthStatusResponse> => {
    return invoke<AuthStatusResponse>('auth_status');
  },

  login: async (username: string, password: string): Promise<void> => {
    return invoke<void>('auth_login', { username, password });
  },

  logout: async (): Promise<void> => {
    return invoke<void>('auth_logout');
  },

  lock: async (): Promise<void> => {
    return invoke<void>('auth_lock');
  },

  unlockPin: async (pin: string): Promise<void> => {
    return invoke<void>('auth_unlock_pin', { pin });
  },

  stepUp: async (permission: string, pin: string): Promise<string> => {
    return invoke<string>('auth_step_up', { permission, pin });
  },
};
