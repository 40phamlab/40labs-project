import '@testing-library/jest-dom/vitest';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AuthGate } from '../AuthGate';
import { authApi } from '../../../api/authApi';
import { renderWithProviders } from '../../../../../../tests/test-utils';

vi.mock('../../../api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/authApi')>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      status: vi.fn(),
      lock: vi.fn(),
    },
  };
});

describe('AuthGate Boundary and States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders unauthenticated state (landing) when no device bound or no business', async () => {
    vi.mocked(authApi.status).mockResolvedValue({
      deviceBound: false,
      business: null,
      session: null,
    });

    renderWithProviders(
      <AuthGate>
        <div data-testid="protected-content">Protected App Shell</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Anza/i })).toBeInTheDocument();
    });
  });

  test('renders login screen when device bound and business exists but no session', async () => {
    vi.mocked(authApi.status).mockResolvedValue({
      deviceBound: true,
      business: {
        id: 'biz-1',
        business_id: 'AFYA-TEST',
        workspace_id: 'ws-1',
        branch_id: 'br-1',
        name: 'Afya Bora Pharmacy',
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
        owner_id: 'user-1',
        onboarding_state: 'setup_complete',
        idle_lock_minutes: 5,
        terms_version: '1.0',
        terms_locale: 'sw-TZ',
        terms_text_sha256: 'abc',
        terms_accepted_at: '2026-01-01T00:00:00Z',
        terms_accepted_by_user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      session: null,
    });

    renderWithProviders(
      <AuthGate>
        <div data-testid="protected-content">Protected App Shell</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText(/Afya Bora Pharmacy/i)).toBeInTheDocument();
    });
  });

  test('renders locked state (LockScreen) when session is locked', async () => {
    vi.mocked(authApi.status).mockResolvedValue({
      deviceBound: true,
      business: {
        id: 'biz-1',
        business_id: 'AFYA-TEST',
        workspace_id: 'ws-1',
        branch_id: 'br-1',
        name: 'Afya Bora Pharmacy',
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
        owner_id: 'user-1',
        onboarding_state: 'setup_complete',
        idle_lock_minutes: 5,
        terms_version: '1.0',
        terms_locale: 'sw-TZ',
        terms_text_sha256: 'abc',
        terms_accepted_at: '2026-01-01T00:00:00Z',
        terms_accepted_by_user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      session: {
        userId: 'user-1',
        displayName: 'Dr. Juma',
        role: 'staff',
        locked: true,
        mustChangeCredentials: false,
        pinSet: true,
        hasRecoveryCodes: true,
      },
    });

    renderWithProviders(
      <AuthGate>
        <div data-testid="protected-content">Protected App Shell</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText(/Kikao kimefungwa/i)).toBeInTheDocument();
    });
  });

  test('renders fully authenticated children when session is valid and setup is complete', async () => {
    vi.mocked(authApi.status).mockResolvedValue({
      deviceBound: true,
      business: {
        id: 'biz-1',
        business_id: 'AFYA-TEST',
        workspace_id: 'ws-1',
        branch_id: 'br-1',
        name: 'Afya Bora Pharmacy',
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
        owner_id: 'user-1',
        onboarding_state: 'setup_complete',
        idle_lock_minutes: 5,
        terms_version: '1.0',
        terms_locale: 'sw-TZ',
        terms_text_sha256: 'abc',
        terms_accepted_at: '2026-01-01T00:00:00Z',
        terms_accepted_by_user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      session: {
        userId: 'user-1',
        displayName: 'Dr. Juma',
        role: 'staff',
        locked: false,
        mustChangeCredentials: false,
        pinSet: true,
        hasRecoveryCodes: true,
      },
    });

    renderWithProviders(
      <AuthGate>
        <div data-testid="protected-content">Protected App Shell</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
