import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoreBackupViewer, BackupPreviewData, RestoreResultData } from './CoreBackupViewer';

const mockPreviewData: BackupPreviewData = {
  business_id: 'biz_123',
  business_name: '40Labs Nairobi Pharmacy',
  workspace_id: 'ws_01',
  branch_id: 'br_01',
  created_at: new Date().toISOString(),
  app_version: '0.1.0',
  schema_version: 1,
  is_schema_compatible: true,
  total_records: 1250,
  record_counts: {
    customers: 500,
    inventory_item: 450,
    sale: 300,
  },
  file_count: 5,
  total_file_bytes: 204800,
  checksum_valid: true,
};

const mockRestoreResult: RestoreResultData = {
  business_id: 'biz_123',
  business_name: '40Labs Nairobi Pharmacy',
  total_records_restored: 1250,
  files_restored: 5,
  safety_backup_path: 'C:\\Data\\backups\\pre_restore_safety_20260309',
  restored_at: new Date().toISOString(),
};

describe('CoreBackupViewer Component', () => {
  test('renders password prompt initially', () => {
    render(<CoreBackupViewer url="blob:test-backup" fileName="test.core" sizeBytes={1024} />);

    expect(screen.getByText('Inspect Disaster Recovery Pack')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter password...')).toBeDefined();
  });

  test('successfully previews backup when correct password is entered', async () => {
    const mockOnPreview = vi.fn(async () => mockPreviewData);

    render(
      <CoreBackupViewer
        url="blob:test-backup"
        fileName="test.core"
        sizeBytes={1024}
        onPreview={mockOnPreview}
      />
    );

    const passwordInput = screen.getByPlaceholderText('Enter password...');
    await userEvent.type(passwordInput, 'CorrectPassword123!');

    const previewBtn = screen.getByRole('button', { name: /preview backup safely/i });
    await userEvent.click(previewBtn);

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith('CorrectPassword123!');
      expect(screen.getByText('40Labs Nairobi Pharmacy')).toBeDefined();
      expect(screen.getByText('1,250')).toBeDefined();
      expect(screen.getByText('Valid .core Pack')).toBeDefined();
    });
  });

  test('shows error when incorrect password is provided', async () => {
    const mockOnPreview = vi.fn(async () => {
      throw new Error('Incorrect password or corrupted backup file.');
    });

    render(
      <CoreBackupViewer
        url="blob:test-backup"
        fileName="test.core"
        sizeBytes={1024}
        onPreview={mockOnPreview}
      />
    );

    const passwordInput = screen.getByPlaceholderText('Enter password...');
    await userEvent.type(passwordInput, 'WrongPassword');

    const previewBtn = screen.getByRole('button', { name: /preview backup safely/i });
    await userEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password or corrupted backup file.')).toBeDefined();
    });
  });

  test('opens restore confirmation modal and executes restore successfully', async () => {
    const mockOnPreview = vi.fn(async () => mockPreviewData);
    const mockOnRestore = vi.fn(async () => mockRestoreResult);

    render(
      <CoreBackupViewer
        url="blob:test-backup"
        fileName="test.core"
        sizeBytes={1024}
        onPreview={mockOnPreview}
        onRestore={mockOnRestore}
      />
    );

    // Preview first
    const passwordInput = screen.getByPlaceholderText('Enter password...');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /preview backup safely/i }));

    await waitFor(() => {
      expect(screen.getByText('40Labs Nairobi Pharmacy')).toBeDefined();
    });

    // Click Restore Backup
    const restoreOpenBtn = screen.getByRole('button', { name: /restore backup.../i });
    await userEvent.click(restoreOpenBtn);

    expect(screen.getByText('Confirm Disaster Recovery Restoration')).toBeDefined();

    // Fill password in modal and confirm
    const modalPasswordInput = screen.getByPlaceholderText('Confirm backup password...');
    await userEvent.type(modalPasswordInput, 'Password123!');

    const confirmRestoreBtn = screen.getByRole('button', { name: /proceed with restore/i });
    await userEvent.click(confirmRestoreBtn);

    await waitFor(() => {
      expect(mockOnRestore).toHaveBeenCalledWith('Password123!');
      expect(screen.getByText('Disaster Recovery Restored Successfully')).toBeDefined();
      expect(screen.getByText(/pre_restore_safety/)).toBeDefined();
    });
  });
});
