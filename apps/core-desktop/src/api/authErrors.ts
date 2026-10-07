export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'LOCKED'
  | 'SESSION_LOCKED'
  | 'SESSION_REQUIRED'
  | 'PIN_SETUP_REQUIRED'
  | 'FORBIDDEN'
  | 'STEP_UP_REQUIRED'
  | 'POLICY_VIOLATION'
  | 'NOT_CONFIGURED'
  | 'NETWORK_UNAVAILABLE';

export interface AuthErrorDetails {
  code: AuthErrorCode | string;
  retryAfterSecs?: number | null;
  permission?: string | null;
  tier?: 'self' | 'sudo' | null;
}

const ERROR_KEY_MAP: Record<string, string> = {
  INVALID_CREDENTIALS: 'auth.error.invalidCredentials',
  LOCKED: 'auth.error.locked',
  SESSION_LOCKED: 'auth.error.sessionLocked',
  SESSION_REQUIRED: 'auth.error.sessionRequired',
  PIN_SETUP_REQUIRED: 'auth.error.pinSetupRequired',
  FORBIDDEN: 'auth.error.forbidden',
  STEP_UP_REQUIRED: 'auth.error.stepUpRequired',
  POLICY_VIOLATION: 'auth.error.policyViolation',
  NOT_CONFIGURED: 'auth.error.notConfigured',
  NETWORK_UNAVAILABLE: 'auth.error.networkUnavailable',
};

export function getAuthErrorI18nKey(code: string): string {
  return ERROR_KEY_MAP[code] || 'auth.error.unknown';
}

export function parseAuthError(error: unknown): AuthErrorDetails {
  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.code === 'string') {
      return {
        code: errObj.code,
        retryAfterSecs: typeof errObj.retryAfterSecs === 'number' ? errObj.retryAfterSecs : null,
        permission: typeof errObj.permission === 'string' ? errObj.permission : null,
        tier: (errObj.tier === 'self' || errObj.tier === 'sudo') ? errObj.tier : null,
      };
    }
    // If error message string contains JSON or error code
    if (typeof errObj.message === 'string') {
      try {
        const parsed = JSON.parse(errObj.message);
        if (parsed && typeof parsed.code === 'string') {
          return {
            code: parsed.code,
            retryAfterSecs: typeof parsed.retryAfterSecs === 'number' ? parsed.retryAfterSecs : null,
            permission: typeof parsed.permission === 'string' ? parsed.permission : null,
            tier: (parsed.tier === 'self' || parsed.tier === 'sudo') ? parsed.tier : null,
          };
        }
      } catch {
        // not json
      }
    }
  }
  return { code: 'NETWORK_UNAVAILABLE', retryAfterSecs: null };
}
