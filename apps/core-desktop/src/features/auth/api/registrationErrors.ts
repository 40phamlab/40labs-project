import { t } from '@40labs/i18n';

export type RegistrationErrorCode =
  | 'INVALID_VERIFICATION'
  | 'INVALID_REGISTRATION_DATA'
  | 'API_UNAVAILABLE'
  | 'ACTIVATION_REJECTED'
  | 'DEVICE_ENROLLMENT_FAILURE'
  | 'DEVICE_SCOPE_CONFLICT'
  | 'DEVICE_REVOKED'
  | 'DEVICE_SYNC_RECORD_CONFLICT'
  | 'SECURE_STORAGE_FAILURE'
  | 'DATABASE_CONSTRAINT_FAILURE'
  | 'TRANSACTION_FAILURE'
  | 'REGISTRATION_ALREADY_COMPLETED'
  | 'REGISTRATION_FAILED';

export interface NormalizedRegistrationError {
  code: RegistrationErrorCode;
  stage?: string;
  retryable: boolean;
  message: string;
  supportCode: string;
}

const errorKeyMap: Record<RegistrationErrorCode, { key: string; retryable: boolean }> = {
  INVALID_VERIFICATION: { key: 'auth.error.invalidVerification', retryable: true },
  INVALID_REGISTRATION_DATA: { key: 'auth.error.registrationValidation', retryable: true },
  API_UNAVAILABLE: { key: 'auth.error.offline', retryable: true },
  ACTIVATION_REJECTED: { key: 'auth.error.activationRejected', retryable: false },
  DEVICE_ENROLLMENT_FAILURE: { key: 'auth.error.deviceEnrollmentFailure', retryable: true },
  DEVICE_SCOPE_CONFLICT: { key: 'auth.error.deviceScopeConflict', retryable: false },
  DEVICE_REVOKED: { key: 'auth.error.deviceRevoked', retryable: false },
  DEVICE_SYNC_RECORD_CONFLICT: { key: 'auth.error.deviceSyncRecordConflict', retryable: false },
  SECURE_STORAGE_FAILURE: { key: 'auth.error.secureStorageFailure', retryable: true },
  DATABASE_CONSTRAINT_FAILURE: { key: 'auth.error.databaseConstraintFailure', retryable: false },
  TRANSACTION_FAILURE: { key: 'auth.error.transactionFailure', retryable: true },
  REGISTRATION_ALREADY_COMPLETED: { key: 'auth.error.registrationAlreadyCompleted', retryable: false },
  REGISTRATION_FAILED: { key: 'auth.error.registrationFailed', retryable: true },
};

const allowedCodes = new Set<RegistrationErrorCode>(Object.keys(errorKeyMap) as RegistrationErrorCode[]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function parseErrorValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return undefined;
    }
  }
  return asRecord(value);
}

export function normalizeRegistrationError(error: unknown, language: string): NormalizedRegistrationError {
  const record = parseErrorValue(error);
  const nested = parseErrorValue(record?.error) ?? parseErrorValue(record?.data) ?? parseErrorValue(record?.cause);
  const rawCode = record?.code ?? nested?.code;
  const code = typeof rawCode === 'string' && allowedCodes.has(rawCode as RegistrationErrorCode)
    ? rawCode as RegistrationErrorCode
    : rawCode === 'POLICY_VIOLATION' ? 'INVALID_REGISTRATION_DATA'
      : rawCode === 'INVALID_CREDENTIALS' ? 'INVALID_VERIFICATION'
        : 'REGISTRATION_FAILED';
  const stageValue = record?.stage ?? nested?.stage;
  const stage = typeof stageValue === 'string' ? stageValue : undefined;
  const retryValue = record?.retryable ?? nested?.retryable;
  const info = errorKeyMap[code];
  const retryable = typeof retryValue === 'boolean' ? retryValue : info.retryable;
  const supportCode = stage ? `${code}:${stage}` : code;

  return {
    code,
    stage,
    retryable,
    message: t(info.key, language),
    supportCode,
  };
}
