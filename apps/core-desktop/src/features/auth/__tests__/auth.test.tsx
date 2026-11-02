import '@testing-library/jest-dom/vitest';
import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LoginScreen } from '../login/LoginScreen';
import { RegistrationWizard } from '../RegistrationWizard';
import { parseAuthError, getAuthErrorI18nKey } from '../../../api/authErrors';
import { VALID_SCREENS } from '../../../stores/useNavStore';
import { renderWithProviders } from '../../../../../../tests/test-utils';

describe('Auth Module Tests', () => {
  test('VALID_SCREENS does not contain auth, preview, or register', () => {
    for (const screenId of VALID_SCREENS) {
      expect(screenId).not.toMatch(/auth|preview|register/i);
    }
  });

  test('renders LoginScreen', async () => {
    renderWithProviders(<LoginScreen businessName="Afya Bora" onLoginSuccess={() => {}} />);
    expect(screen.getAllByRole('button', { name: /^PIN$/i })[0]).toBeInTheDocument();
  });

  test('renders RegistrationWizard step 1', async () => {
    renderWithProviders(<RegistrationWizard onComplete={() => {}} />);
    expect(screen.getByRole('heading', { name: /^Biashara$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Duka la Dawa Afya Bora/i)).toBeInTheDocument();
  });

  test('correctly parses auth error codes and i18n keys', () => {
    const err = { code: 'INVALID_CREDENTIALS', retryAfterSecs: 30 };
    const parsed = parseAuthError(err);
    expect(parsed.code).toBe('INVALID_CREDENTIALS');
    expect(parsed.retryAfterSecs).toBe(30);

    const i18nKey = getAuthErrorI18nKey('LOCKED');
    expect(i18nKey).toBe('auth.error.locked');
  });
});
