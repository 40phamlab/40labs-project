import type { Business } from '@40labs/types';
import { invokeCommand, isTauriAvailable } from './client';
import { logAuthDebug } from '../lib/debugLog';

export interface AuthStatusResponse {
  deviceBound: boolean;
  business: Business | null;
  session: {
    userId: string;
    displayName: string;
    role: string;
    locked: boolean;
    mustChangeCredentials: boolean;
    pinSet: boolean;
    hasRecoveryCodes: boolean;
  } | null;
  onboardingState?: string;
  idleLockMinutes?: number;
}

export interface AuthApi {
  status(): Promise<AuthStatusResponse>;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  lock(): Promise<void>;
  unlockPin(pin: string): Promise<void>;
  setPin(pin: string): Promise<void>;
  stepUp(permission: string, pin: string, approverUserId?: string): Promise<string>;
  listApprovers(permission: string): Promise<Array<{ userId: string; displayName: string; role: string }>>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  changePin(oldPin: string, newPin: string): Promise<void>;
  resetOwnPin(password: string, newPin: string): Promise<void>;
  usersList(): Promise<Array<any>>;
  userCreate(payload: any): Promise<any>;
  userUpdate(userId: string, payload: any): Promise<any>;
  userSetActive(userId: string, active: boolean): Promise<void>;
  userResetCredentials(userId: string): Promise<string>;
  recoveryRedeem(username: string, code: string, newPassword: string): Promise<void>;
  recoveryRegenerate(password: string): Promise<Array<string>>;
  recoveryGenerateInitial(): Promise<Array<string>>;
  registrationCommit(payload: any): Promise<void>;
  otpRequest(phone: string): Promise<void>;
  otpVerify(phone: string, code: string): Promise<string>;
  onboardingAdvance(state: string): Promise<void>;
  businessSetIdleLock(minutes: number): Promise<void>;
}

// Mock initial state: session: null, deviceBound: false, business: null, no seeded users
let mockState: AuthStatusResponse = {
  deviceBound: false,
  business: null,
  session: null,
  onboardingState: 'registered',
  idleLockMinutes: 5,
};

let mockPinFailures = 0;
let mockLockoutUntil = 0;

export const tauriAuthApi: AuthApi = {
  status: () => invokeCommand<AuthStatusResponse>('auth_status'),
  login: (username, password) => invokeCommand<void>('auth_login', { username, password }),
  logout: () => invokeCommand<void>('auth_logout'),
  lock: () => invokeCommand<void>('auth_lock'),
  unlockPin: (pin) => invokeCommand<void>('auth_unlock_pin', { pin }),
  setPin: (pin) => invokeCommand<void>('auth_set_pin', { pin }),
  stepUp: (permission, pin, approverUserId) => invokeCommand<string>('auth_step_up', { permission, pin, approverUserId }),
  listApprovers: (permission) => invokeCommand<Array<{ userId: string; displayName: string; role: string }>>('auth_list_approvers', { permission }),
  changePassword: (oldPassword, newPassword) => invokeCommand<void>('auth_change_password', { oldPassword, newPassword }),
  changePin: (oldPin, newPin) => invokeCommand<void>('auth_change_pin', { oldPin, newPin }),
  resetOwnPin: (password, newPin) => invokeCommand<void>('auth_reset_own_pin', { password, newPin }),
  usersList: () => invokeCommand<Array<any>>('user_list'),
  userCreate: (payload) => invokeCommand<any>('user_create', { payload }),
  userUpdate: (userId, payload) => invokeCommand<any>('user_update', { userId, payload }),
  userSetActive: (userId, active) => invokeCommand<void>('user_set_active', { userId, active }),
  userResetCredentials: (userId) => invokeCommand<string>('user_reset_credentials', { userId }),
  recoveryRedeem: (username, code, newPassword) => invokeCommand<void>('recovery_redeem', { username, code, newPassword }),
  recoveryRegenerate: (password) => invokeCommand<Array<string>>('recovery_regenerate', { password }),
  recoveryGenerateInitial: () => invokeCommand<Array<string>>('recovery_generate_initial'),
  registrationCommit: (payload) => invokeCommand<void>('registration_commit', { payload }),
  otpRequest: (phone) => invokeCommand<void>('otp_request', { phone }),
  otpVerify: (phone, code) => invokeCommand<string>('otp_verify', { phone, code }),
  onboardingAdvance: (state) => invokeCommand<void>('onboarding_advance', { state }),
  businessSetIdleLock: (minutes) => invokeCommand<void>('business_set_idle_lock', { minutes }),
};

export const mockAuthApi: AuthApi = {
  status: async () => ({ ...mockState }),
  login: async (username, password) => {
    if (!username || !password) {
      throw { code: 'INVALID_CREDENTIALS' };
    }
    mockState.session = {
      userId: 'user-mock-1',
      displayName: username,
      role: username.includes('sudo') ? 'sudo' : 'staff',
      locked: false,
      mustChangeCredentials: false,
      pinSet: true,
      hasRecoveryCodes: true,
    };
  },
  logout: async () => {
    mockState.session = null;
  },
  lock: async () => {
    if (mockState.session) {
      mockState.session.locked = true;
    }
  },
  unlockPin: async (pin) => {
    if (Date.now() < mockLockoutUntil) {
      throw { code: 'LOCKED', retryAfterSecs: Math.ceil((mockLockoutUntil - Date.now()) / 1000) };
    }
    if (pin !== '123456') {
      mockPinFailures++;
      if (mockPinFailures >= 5) {
        mockState.session = null;
        mockPinFailures = 0;
        throw { code: 'INVALID_CREDENTIALS' };
      }
      if (mockPinFailures >= 3) {
        mockLockoutUntil = Date.now() + 5000;
        throw { code: 'INVALID_CREDENTIALS', retryAfterSecs: 5 };
      }
      throw { code: 'INVALID_CREDENTIALS', retryAfterSecs: 0 };
    }
    mockPinFailures = 0;
    mockLockoutUntil = 0;
    if (mockState.session) {
      mockState.session.locked = false;
    }
  },
  setPin: async (pin) => {
    if (pin.length !== 6) {
      throw { code: 'POLICY_VIOLATION' };
    }
    if (mockState.session) {
      mockState.session.pinSet = true;
    }
  },
  stepUp: async (_permission, pin) => {
    if (pin !== '123456') {
      throw { code: 'INVALID_CREDENTIALS' };
    }
    return `grant-${Math.random().toString(36).substring(2, 9)}`;
  },
  listApprovers: async () => [
    { userId: 'user-sudo-1', displayName: 'Juma Mwanga (SUDO)', role: 'sudo' },
  ],
  changePassword: async () => {},
  changePin: async () => {},
  resetOwnPin: async () => {},
  usersList: async () => [],
  userCreate: async (p) => p,
  userUpdate: async (_id, p) => p,
  userSetActive: async () => {},
  userResetCredentials: async () => 'temp-pass-123',
  recoveryRedeem: async (username, code, newPassword) => {
    if (!username || !code || !newPassword) {
      throw { code: 'INVALID_CREDENTIALS' };
    }
  },
  recoveryRegenerate: async () => ['ABCDE-12345', 'FGHIJ-67890'],
  recoveryGenerateInitial: async () => ['ABCDE-12345', 'FGHIJ-67890'],
  registrationCommit: async (payload) => {
    mockState.deviceBound = true;
    mockState.business = {
      id: 'biz-1',
      business_id: 'AFYA-TEST01',
      workspace_id: 'ws-01',
      branch_id: 'branch-1',
      name: payload.name || 'Afya Bora Pharmacy',
      tin: null,
      tmda_number: null,
      role_scopes: ['pharmacy'],
      tier: 'class_1',
      business_type: 'Pharmacy',
      scale: 'medium',
      logo_url: null,
      appearance_mode: 'light',
      contacts: { mobile: '+255712345678', email: 'info@afyabora.co.tz', whatsapp: null },
      address: { region: 'Dar es Salaam', district: 'Kinondoni', place: 'Mwananyamala' },
      owner_id: 'user-sudo-1',
      onboarding_state: 'setup_complete',
      idle_lock_minutes: 5,
      terms_version: '1.0',
      terms_locale: 'sw-TZ',
      terms_text_sha256: 'abc123sha',
      terms_accepted_at: '2026-10-01T00:00:00Z',
      terms_accepted_by_user_id: 'user-sudo-1',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    };
    mockState.session = null;
  },
  otpRequest: async () => {},
  otpVerify: async () => 'mock-verification-token',
  onboardingAdvance: async (state) => {
    if (mockState.business) {
      mockState.business.onboarding_state = state as any;
    }
  },
  businessSetIdleLock: async (minutes) => {
    if (mockState.business) {
      mockState.business.idle_lock_minutes = minutes;
    }
    mockState.idleLockMinutes = minutes;
  },
};

const failUnavailable: AuthApi = new Proxy({} as AuthApi, {
  get(_target, _prop: keyof AuthApi) {
    return async () => {
      throw { code: 'RUNTIME_UNAVAILABLE' };
    };
  },
});

export const authApi: AuthApi = new Proxy({} as AuthApi, {
  get(_target, prop: keyof AuthApi) {
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const tauri = isTauriAvailable();

    let activeApi: AuthApi;
    if (tauri) {
      activeApi = tauriAuthApi;
    } else if (isDev) {
      activeApi = mockAuthApi;
    } else {
      activeApi = failUnavailable;
    }

    const fn = activeApi[prop];
    if (typeof fn === 'function') {
      return async (...args: any[]) => {
        const start = performance.now();
        try {
          const res = await (fn as any)(...args);
          const duration = Math.round(performance.now() - start);
          logAuthDebug(String(prop), duration, true);
          return res;
        } catch (err: any) {
          const duration = Math.round(performance.now() - start);
          const code = err?.code || 'ERROR';
          logAuthDebug(String(prop), duration, false, code);
          throw err;
        }
      };
    }
    return fn;
  },
});
