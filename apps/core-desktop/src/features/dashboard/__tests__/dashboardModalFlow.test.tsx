// [phase: 8D] Modal-Open -> Create -> Card-Refresh Flow Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import { DashboardScreen } from '../DashboardScreen';
import { ToastProvider } from '../../../hooks/useToast';
import { customersApi } from '../../../api/customersApi';

vi.mock('../../../api/dashboardApi', () => ({
  dashboardApi: {
    getSummary: vi.fn().mockImplementation(() => Promise.resolve(getInitialDashboardSummary())),
  },
}));

vi.mock('../../../api/customersApi', () => ({
  customersApi: {
    addCustomer: vi.fn().mockResolvedValue({ id: 'c_new_123', full_name: 'Amina Ali', phone: '0712345678' }),
  },
}));

vi.mock('../../../api/purchasesApi', () => ({
  purchasesApi: {
    listSuppliers: vi.fn().mockResolvedValue([{ id: 'sup_1', name: 'Kibo Supplies' }]),
    create: vi.fn().mockResolvedValue({ id: 'po_new_123', status: 'draft' }),
  },
}));

describe('Dashboard Modal Flow & Refresh [phase: 8D]', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.clearAllMocks();
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <DashboardScreen />
        </ToastProvider>
      </QueryClientProvider>
    );

  it('opens Customer modal when clicking Ongeza Mgonjwa quick action', async () => {
    renderDashboard();

    // Wait for dashboard summary to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mauzo KPI/i })).toBeInTheDocument();
    });

    const addCustomerBtn = screen.getByRole('button', { name: /Ongeza Mgonjwa/i });
    fireEvent.click(addCustomerBtn);

    // Verify modal title appears
    await waitFor(() => {
      expect(screen.getByText('Add Customer Profile')).toBeInTheDocument();
    });
  }, 10000);

  it('submits new customer form and invalidates query cache', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mauzo KPI/i })).toBeInTheDocument();
    });

    // Open customer modal
    fireEvent.click(screen.getByRole('button', { name: /Ongeza Mgonjwa/i }));

    await waitFor(() => {
      expect(screen.getByText('Add Customer Profile')).toBeInTheDocument();
    });

    // Fill form fields
    const nameInput = screen.getByPlaceholderText('e.g. Juma Hamisi');
    const phoneInput = screen.getByPlaceholderText('0712 345 678');

    fireEvent.change(nameInput, { target: { value: 'Amina Ali' } });
    fireEvent.change(phoneInput, { target: { value: '0712345678' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Save Customer/i });
    fireEvent.click(saveBtn);

    // Verify customersApi called
    await waitFor(() => {
      expect(customersApi.addCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Amina Ali',
          phone: '255712345678',
        })
      );
    });

    // Verify query cache invalidation for dashboard, customers, and inventory
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customers'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
    });
  }, 10000);
});
