import { describe, expect, it } from 'vitest';
import { normalizeRegistrationError } from './registrationErrors';

describe('normalizeRegistrationError', () => {
  it.each([
    ['INVALID_VERIFICATION', 'sw'],
    ['INVALID_REGISTRATION_DATA', 'en'],
    ['API_UNAVAILABLE', 'sw'],
    ['ACTIVATION_REJECTED', 'en'],
    ['DEVICE_ENROLLMENT_FAILURE', 'sw'],
    ['SECURE_STORAGE_FAILURE', 'en'],
    ['DATABASE_CONSTRAINT_FAILURE', 'sw'],
    ['TRANSACTION_FAILURE', 'en'],
    ['REGISTRATION_ALREADY_COMPLETED', 'sw'],
  ])('normalizes %s into localized safe copy', (code, language) => {
    const result = normalizeRegistrationError({ code, stage: 'device_enrollment', retryable: true, token: 'never show me' }, language);
    expect(result.code).toBe(code);
    expect(result.stage).toBe('device_enrollment');
    expect(result.message).not.toContain('never show me');
    expect(result.message.length).toBeGreaterThan(10);
  });

  it('reads serialized Rust errors and does not expose raw error text', () => {
    const result = normalizeRegistrationError(JSON.stringify({ code: 'SECURE_STORAGE_FAILURE', stage: 'credential_storage', message: 'refresh-token-value' }), 'en');
    expect(result.code).toBe('SECURE_STORAGE_FAILURE');
    expect(result.stage).toBe('credential_storage');
    expect(result.message).not.toContain('refresh-token-value');
  });

  it('maps legacy auth errors and unknown values safely', () => {
    expect(normalizeRegistrationError({ code: 'POLICY_VIOLATION' }, 'en').code).toBe('INVALID_REGISTRATION_DATA');
    expect(normalizeRegistrationError({ code: 'INVALID_CREDENTIALS' }, 'sw').code).toBe('INVALID_VERIFICATION');
    expect(normalizeRegistrationError('untrusted raw details', 'en').code).toBe('REGISTRATION_FAILED');
  });
});
