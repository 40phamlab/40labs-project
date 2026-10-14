import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomersScreen } from '../CustomersScreen';
import { useCustomers } from '../../../hooks/useCustomers';
import { useNavStore } from '../../../stores/useNavStore';
import type { Customer } from '@40labs/types';

vi.mock('../../../hooks/useCustomers');
vi.mock('../../../stores/useNavStore');

const mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: 'Baraka Mussa',
    phone: '+255712345678',
    email: 'baraka@example.com',
    outstanding_balance: 15000,
    notes: 'VIP debtor',
    dob: '1988-03-12',
    sex: 'male',
    blood_group: 'O+',
    allergies: null,
    chronic_conditions: null,
    current_medications: null,
    emergency_contact: null,
    ward_district: 'Kinondoni',
    pharmacy_notes: null,
    archived_at: null,
    amob_patient_id: null,
  },
  {
    id: 'cust_002',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date().toISOString(),
    full_name: 'Amina Salum',
    phone: '+255754000111',
    email: 'amina@example.com',
    outstanding_balance: 0,
    notes: 'Zero balance patient',
    dob: '1995-07-20',
    sex: 'female',
    blood_group: 'A+',
    allergies: null,
    chronic_conditions: null,
    current_medications: null,
    emergency_contact: null,
    ward_district: 'Ilala',
    pharmacy_notes: null,
    archived_at: null,
    amob_patient_id: null,
  },
  {
    id: 'cust_003_archived',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    full_name: 'Old Archived Customer',
    phone: '+255799000999',
    email: 'archived@example.com',
    outstanding_balance: 0,
    notes: 'Archived record',
    dob: null,
    sex: null,
    blood_group: null,
    allergies: null,
    chronic_conditions: null,
    current_medications: null,
    emergency_contact: null,
    ward_district: null,
    pharmacy_notes: null,
    archived_at: '2025-06-01T00:00:00Z',
    amob_patient_id: null,
  },
];

describe('CustomersScreen & List Interaction Suite', () => {
  const mockSetPatientDetailId = vi.fn();
  const mockSetSearchTerm = vi.fn();
  const mockSetAddModalOpen = vi.fn();
  const mockRefetch = vi.fn();
  const mockAddCustomer = vi.fn();
  const mockUpdateCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavStore).mockImplementation((selector: any) =>
      selector({
        patientDetailId: null,
        setPatientDetailId: mockSetPatientDetailId,
      })
    );

    vi.mocked(useCustomers).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      searchTerm: '',
      setSearchTerm: mockSetSearchTerm,
      selectedCustomerId: null,
      setSelectedCustomerId: vi.fn(),
      isAddModalOpen: false,
      setAddModalOpen: mockSetAddModalOpen,
      addCustomer: mockAddCustomer,
      updateCustomer: mockUpdateCustomer,
      updateCustomerNotes: vi.fn(),
      deleteCustomer: vi.fn(),
      isAdding: false,
      isUpdating: false,
    });
  });

  it('renders active customer list by default and hides archived customer', () => {
    render(<CustomersScreen />);

    expect(screen.getByText('Baraka Mussa')).toBeInTheDocument();
    expect(screen.getByText('Amina Salum')).toBeInTheDocument();
    expect(screen.queryByText('Old Archived Customer')).not.toBeInTheDocument();
  });

  it('filters customers when typing into the search input', () => {
    vi.mocked(useCustomers).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      searchTerm: 'baraka',
      setSearchTerm: mockSetSearchTerm,
      selectedCustomerId: null,
      setSelectedCustomerId: vi.fn(),
      isAddModalOpen: false,
      setAddModalOpen: mockSetAddModalOpen,
      addCustomer: mockAddCustomer,
      updateCustomer: mockUpdateCustomer,
      updateCustomerNotes: vi.fn(),
      deleteCustomer: vi.fn(),
      isAdding: false,
      isUpdating: false,
    });

    render(<CustomersScreen />);

    expect(screen.getByText('Baraka Mussa')).toBeInTheDocument();
    expect(screen.queryByText('Amina Salum')).not.toBeInTheDocument();
  });

  it('opens customer detail profile on row click', () => {
    render(<CustomersScreen />);

    const barakaRow = screen.getByText('Baraka Mussa');
    fireEvent.click(barakaRow);

    expect(mockSetPatientDetailId).toHaveBeenCalledWith('cust_001');
  });

  it('shows error state with retry button when database error occurs', () => {
    vi.mocked(useCustomers).mockReturnValue({
      customers: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load customers from SQLite database'),
      refetch: mockRefetch,
      searchTerm: '',
      setSearchTerm: mockSetSearchTerm,
      selectedCustomerId: null,
      setSelectedCustomerId: vi.fn(),
      isAddModalOpen: false,
      setAddModalOpen: mockSetAddModalOpen,
      addCustomer: mockAddCustomer,
      updateCustomer: mockUpdateCustomer,
      updateCustomerNotes: vi.fn(),
      deleteCustomer: vi.fn(),
      isAdding: false,
      isUpdating: false,
    });

    render(<CustomersScreen />);

    expect(screen.getByText(/Failed to load customers from SQLite database/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
