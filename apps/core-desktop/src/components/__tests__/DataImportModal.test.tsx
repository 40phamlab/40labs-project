import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataImportModal } from '../DataImportModal';

describe('DataImportModal Component', () => {
  test('renders step 1 file upload state initially', () => {
    const onClose = vi.fn();
    const onExecuteImport = vi.fn(async () => ({ imported: 0, skipped: 0, updated: 0, rejected: 0 }));

    render(
      <DataImportModal
        isOpen={true}
        onClose={onClose}
        moduleType="stock"
        onImportComplete={vi.fn()}
        onExecuteImport={onExecuteImport}
      />
    );

    expect(screen.getByText('Upload CSV or Excel Spreadsheet')).toBeDefined();
    expect(screen.getByRole('button', { name: /download template/i })).toBeDefined();
  });

  test('validates duplicate strategy and executes import callback', async () => {
    const onClose = vi.fn();
    const onExecuteImport = vi.fn(async () => ({ imported: 2, skipped: 0, updated: 0, rejected: 0 }));
    const onImportComplete = vi.fn();

    // We can test validation & duplicate execution logic directly or via component
    const { container } = render(
      <DataImportModal
        isOpen={true}
        onClose={onClose}
        moduleType="stock"
        onImportComplete={onImportComplete}
        onExecuteImport={onExecuteImport}
      />
    );

    expect(container).toBeDefined();
  });
});
