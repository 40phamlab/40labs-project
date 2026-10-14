import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DispensingTab } from '../components/tabs/DispensingTab';
import { LabResultsTab } from '../components/tabs/LabResultsTab';
import { useSales } from '../../../hooks/useSales';
import { useLab } from '../../../hooks/useLab';
import type { Customer } from '@40labs/types';

vi.mock('../../../hooks/useSales');
vi.mock('../../../hooks/useLab');
vi.mock('../../../stores/useNavStore', () => ({
  useNavStore: (selector: any) => selector({ setActiveScreen: vi.fn() }),
}));

const mockCustomer: Customer = {
  id: 'cust_001',
  workspace_id: 'ws_1',
  branch_id: 'br_1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  full_name: 'Test Customer',
  phone: '+255712345678',
  email: 'test@example.com',
  outstanding_balance: 0,
  notes: '',
  dob: null,
  sex: null,
  blood_group: null,
  allergies: null,
  chronic_conditions: null,
  current_medications: null,
  emergency_contact: null,
  ward_district: null,
  pharmacy_notes: null,
  archived_at: null,
  amob_patient_id: null,
};

describe('Customer Tabs (DispensingTab & LabResultsTab)', () => {
  it('renders loading state in DispensingTab', () => {
    vi.mocked(useSales).mockReturnValue({
      completedSales: [],
      isLoadingSales: true,
      isSalesError: false,
      salesError: null,
      refetchSales: vi.fn(),
    } as any);

    render(<DispensingTab customer={mockCustomer} />);
    expect(screen.getByText(/loading dispensing records/i)).toBeInTheDocument();
  });

  it('renders error state and handles retry in DispensingTab', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useSales).mockReturnValue({
      completedSales: [],
      isLoadingSales: false,
      isSalesError: true,
      salesError: new Error('Sales DB error'),
      refetchSales: mockRefetch,
    } as any);

    render(<DispensingTab customer={mockCustomer} />);
    expect(screen.getByText(/failed to load dispensing records/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders loading state in LabResultsTab', () => {
    vi.mocked(useLab).mockReturnValue({
      orders: [],
      results: [],
      catalog: [],
      isLoadingOrders: true,
      isOrdersError: false,
      errorOrders: null,
      refetchOrders: vi.fn(),
    } as any);

    render(<LabResultsTab customer={mockCustomer} />);
    expect(screen.getByText(/loading laboratory records/i)).toBeInTheDocument();
  });

  it('renders error state and handles retry in LabResultsTab', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useLab).mockReturnValue({
      orders: [],
      results: [],
      catalog: [],
      isLoadingOrders: false,
      isOrdersError: true,
      errorOrders: new Error('Lab DB error'),
      refetchOrders: mockRefetch,
    } as any);

    render(<LabResultsTab customer={mockCustomer} />);
    expect(screen.getByText(/failed to load lab results/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
