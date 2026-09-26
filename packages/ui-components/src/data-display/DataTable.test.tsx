import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, ColumnDefinition } from './DataTable';

interface SampleRow {
  id: string;
  name: string;
  category: string;
  price: number;
}

const sampleColumns: ColumnDefinition<SampleRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category' },
  {
    key: 'price',
    header: 'Price',
    render: (row) => `$${row.price.toFixed(2)}`,
  },
];

const sampleData: SampleRow[] = [
  { id: '1', name: 'Amoxicillin', category: 'Antibiotic', price: 15.5 },
  { id: '2', name: 'Paracetamol', category: 'Analgesic', price: 5.0 },
];

describe('DataTable Component', () => {
  test('renders headers and dataset rows', () => {
    render(<DataTable data={sampleData} columns={sampleColumns} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();

    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    expect(screen.getByText('Antibiotic')).toBeInTheDocument();
    expect(screen.getByText('$15.50')).toBeInTheDocument();

    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  test('handles row click callback', async () => {
    const handleRowClick = vi.fn();
    render(<DataTable data={sampleData} columns={sampleColumns} onRowClick={handleRowClick} />);

    const firstRow = screen.getByText('Amoxicillin');
    await userEvent.click(firstRow);

    expect(handleRowClick).toHaveBeenCalledWith(sampleData[0], 0);
  });

  test('handles row selection checkboxes and select all', async () => {
    const handleSelectRow = vi.fn();
    const handleSelectAll = vi.fn();

    render(
      <DataTable
        data={sampleData}
        columns={sampleColumns}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />
    );

    const selectAllCheckbox = screen.getByLabelText(/select all rows/i);
    expect(selectAllCheckbox).toBeInTheDocument();

    await userEvent.click(selectAllCheckbox);
    expect(handleSelectAll).toHaveBeenCalledWith(true);

    const rowCheckbox = screen.getByLabelText('Select row 1');
    await userEvent.click(rowCheckbox);
    expect(handleSelectRow).toHaveBeenCalledWith(sampleData[0]);
  });

  test('renders loading and error states', () => {
    const { rerender } = render(
      <DataTable data={[]} columns={sampleColumns} loading loadingMessage="Loading stock..." />
    );
    expect(screen.getByText('Loading stock...')).toBeInTheDocument();

    rerender(
      <DataTable data={[]} columns={sampleColumns} error="Failed to fetch data" />
    );
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });

  test('renders empty state when data array is empty', () => {
    render(<DataTable data={[]} columns={sampleColumns} emptyMessage="No stock items found" />);
    expect(screen.getByText('No stock items found')).toBeInTheDocument();
  });
});
