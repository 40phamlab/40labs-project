import '@testing-library/jest-dom/vitest';
import { describe, test, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryScreen } from './InventoryScreen';
import { renderWithProviders } from '../../../../../tests/test-utils';

describe('InventoryScreen Integration', () => {
  test('renders InventoryScreen with page header and action buttons', async () => {
    renderWithProviders(<InventoryScreen />);

    expect(screen.getByRole('heading', { name: /inventory management/i })).toBeInTheDocument();

    const addStockButton = screen.getByRole('button', { name: /add stock/i });
    expect(addStockButton).toBeInTheDocument();
  });

  test('displays inventory stock items from initial data', async () => {
    renderWithProviders(<InventoryScreen />);

    // Wait for react-query to resolve and render items
    await waitFor(() => {
      expect(screen.getByText(/Amoxicillin/i)).toBeInTheDocument();
    });
  });

  test('filters inventory items when typing into the search input', async () => {
    renderWithProviders(<InventoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Amoxicillin/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name, generic, or batch/i);
    await userEvent.type(searchInput, 'Paracetamol');

    await waitFor(() => {
      expect(screen.getByText(/Paracetamol/i)).toBeInTheDocument();
      expect(screen.queryByText(/Amoxicillin/i)).not.toBeInTheDocument();
    });
  });

  test('opens Add Stock modal when Add Stock button is clicked', async () => {
    renderWithProviders(<InventoryScreen />);

    const addStockButton = screen.getByRole('button', { name: /add stock/i });
    await userEvent.click(addStockButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add new stock item/i })).toBeInTheDocument();
    });
  });
});
