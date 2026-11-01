import '@testing-library/jest-dom/vitest';
import { describe, test, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from '../login/LoginScreen';
import { RegistrationWizard } from '../RegistrationWizard';
import { parseAuthError, getAuthErrorI18nKey } from '../../../api/authErrors';
import { renderWithProviders } from '../../../../../../tests/test-utils';

describe('Auth Module Tests', () => {
  test('renders LoginScreen with default PIN tab', async () => {
    renderWithProviders(<LoginScreen businessName="Afya Bora" onLoginSuccess={() => {}} />);

    expect(screen.getByText(/Karibu Afya Bora/i)).toBeInTheDocument();
    const pinTabBtn = screen.getByRole('button', { name: /^PIN$/i });
    expect(pinTabBtn).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/Jina la mtumiaji/i);
    await userEvent.type(usernameInput, 'sudo_user');
    expect(usernameInput).toHaveValue('sudo_user');
  });

  test('switches between PIN and Password tabs', async () => {
    renderWithProviders(<LoginScreen businessName="Afya Bora" onLoginSuccess={() => {}} />);

    const passwordTabBtn = screen.getByRole('button', { name: /^Nenosiri$/i });
    fireEvent.click(passwordTabBtn);

    const passwordInput = screen.getByPlaceholderText(/Weka nenosiri/i);
    expect(passwordInput).toBeInTheDocument();
  });

  test('renders RegistrationWizard step 1', async () => {
    renderWithProviders(<RegistrationWizard onComplete={() => {}} />);

    expect(screen.getAllByRole('heading', { name: /^Biashara$/i })[0]).toBeInTheDocument();
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
