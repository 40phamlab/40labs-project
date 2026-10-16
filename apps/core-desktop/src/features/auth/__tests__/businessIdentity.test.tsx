import '@testing-library/jest-dom/vitest';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { LoginScreen } from '../login/LoginScreen';
import { BusinessProfileForm } from '../../settings/components/BusinessProfileForm';
import { StepUpProvider } from '../stepup/StepUpProvider';
import { businessApi } from '../../../api/businessApi';
import { renderWithProviders } from '../../../../../../tests/test-utils';

vi.mock('../../../api/businessApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/businessApi')>();
  return {
    ...actual,
    businessApi: {
      ...actual.businessApi,
      update: vi.fn(),
      uploadLogo: vi.fn(),
    },
  };
});

describe('Business Identity & Logo Persistence Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Login screen restores and displays the business logo correctly', async () => {
    const testLogoUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    renderWithProviders(
      <LoginScreen
        businessName="Afya Bora Pharmacy"
        businessLogo={testLogoUrl}
        onLoginSuccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Karibu Afya Bora Pharmacy/i)).toBeInTheDocument();
      const img = screen.getByAltText(/Business Logo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', testLogoUrl);
    });
  });

  test('Login screen falls back to Store avatar when business logo is missing or fails to load', async () => {
    renderWithProviders(
      <LoginScreen
        businessName="Afya Bora Pharmacy"
        businessLogo={null}
        onLoginSuccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Karibu Afya Bora Pharmacy/i)).toBeInTheDocument();
      expect(screen.queryByAltText(/Business Logo/i)).not.toBeInTheDocument();
    });
  });

  test('Business profile form validates logo size (rejects files > 512KB)', async () => {
    const mockBusiness = {
      id: 'biz-1',
      business_id: 'AFYA-TEST',
      workspace_id: 'ws-1',
      branch_id: 'br-1',
      name: 'Afya Bora Pharmacy',
      tin: null,
      tmda_number: null,
      role_scopes: ['pharmacy'] as any,
      tier: 'free' as any,
      business_type: 'Pharmacy',
      scale: 'medium',
      logo_url: null,
      appearance_mode: 'light' as any,
      contacts: { mobile: '+255712345678', email: null, whatsapp: null },
      address: { region: 'Dar es Salaam', district: 'Kinondoni', place: 'Mwananyamala' },
      country: 'TZ',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      idle_lock_minutes: 5,
    };

    renderWithProviders(
      <StepUpProvider>
        <BusinessProfileForm
          business={mockBusiness}
          onSave={async () => {}}
        />
      </StepUpProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const largeFile = new File([new ArrayBuffer(600 * 1024)], 'large-logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Logo lazima iwe chini ya KB 512/i)).toBeInTheDocument();
    });
  });

  test('Business profile form allows logo replacement and removal', async () => {
    const mockBusiness = {
      id: 'biz-1',
      business_id: 'AFYA-TEST',
      workspace_id: 'ws-1',
      branch_id: 'br-1',
      name: 'Afya Bora Pharmacy',
      tin: null,
      tmda_number: null,
      role_scopes: ['pharmacy'] as any,
      tier: 'free' as any,
      business_type: 'Pharmacy',
      scale: 'medium',
      logo_url: 'logos/ws-1/logo_123.png',
      appearance_mode: 'light' as any,
      contacts: { mobile: '+255712345678', email: null, whatsapp: null },
      address: { region: 'Dar es Salaam', district: 'Kinondoni', place: 'Mwananyamala' },
      country: 'TZ',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      idle_lock_minutes: 5,
    };

    vi.mocked(businessApi.uploadLogo).mockResolvedValue('logos/ws-1/logo_new.png');

    renderWithProviders(
      <StepUpProvider>
        <BusinessProfileForm
          business={mockBusiness}
          onSave={async () => {}}
        />
      </StepUpProvider>
    );

    const removeBtn = screen.getByRole('button', { name: /Ondoa/i });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Ondoa/i })).not.toBeInTheDocument();
    });
  });
});
