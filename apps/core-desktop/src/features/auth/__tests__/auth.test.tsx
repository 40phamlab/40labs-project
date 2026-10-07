import '@testing-library/jest-dom/vitest';
import { describe, test, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from '../LoginScreen';
import { RegistrationWizard } from '../RegistrationWizard';
import { parseAuthError, getAuthErrorI18nKey } from '../../../api/authErrors';
import { renderWithProviders } from '../../../../../../tests/test-utils';

describe('Auth Module Tests', () => {
  test('renders LoginScreen and handles input typing', async () => {
    renderWithProviders(<LoginScreen businessName="Afya Bora" onLoginSuccess={() => {}} />);

    expect(screen.getByText(/Karibu Afya Bora/i)).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await userEvent.type(usernameInput, 'sudo_user');
    await userEvent.type(passwordInput, 'SecurePass123!');

    expect(usernameInput).toHaveValue('sudo_user');
    expect(passwordInput).toHaveValue('SecurePass123!');
  });

  test('renders RegistrationWizard step 1', async () => {
    renderWithProviders(<RegistrationWizard onComplete={() => {}} />);

    expect(screen.getByText(/Biashara/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Jina la biashara/i)).toBeInTheDocument();
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
