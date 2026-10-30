import '@testing-library/jest-dom/vitest';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductRow } from '../components/ProductRow';

describe('ProductRow Regression Test (Cart/Mauzo Search Panel)', () => {
  test('renders product as a normal list entry with proper name, price, stock, and add action', () => {
    const handleAdd = vi.fn();
    render(
      <ProductRow
        name="Paracetamol 500mg"
        sku="PARA-500"
        stock={150}
        price={5000}
        onAdd={handleAdd}
      />
    );

    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /Add/i });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });
});
