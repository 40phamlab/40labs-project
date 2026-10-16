import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorerScreen } from '../ExplorerScreen';

const mockOpenFile = vi.fn();
const mockOpenBlob = vi.fn();

vi.mock('../../../providers/FilePreviewProvider', () => ({
  useFilePreviewContext: () => ({
    openFile: mockOpenFile,
    openBlob: mockOpenBlob,
    closeFileTab: vi.fn(),
    selectFileTab: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  }),
}));

const mockDefaultDir = 'C:\\Users\\User\\Documents\\40Labs';

const mockDirectoryContent = {
  current_path: 'C:\\Users\\User\\Documents\\40Labs',
  parent_path: 'C:\\Users\\User\\Documents',
  items: [
    {
      name: 'Reports',
      path: 'C:\\Users\\User\\Documents\\40Labs\\Reports',
      is_dir: true,
      is_symlink: false,
      size_bytes: 0,
      extension: '',
      modified_at: 1700000000000,
    },
    {
      name: 'patient_records.pdf',
      path: 'C:\\Users\\User\\Documents\\40Labs\\patient_records.pdf',
      is_dir: false,
      is_symlink: false,
      size_bytes: 1048576,
      extension: 'pdf',
      modified_at: 1700001000000,
    },
    {
      name: 'lab_notes.txt',
      path: 'C:\\Users\\User\\Documents\\40Labs\\lab_notes.txt',
      is_dir: false,
      is_symlink: false,
      size_bytes: 512,
      extension: 'txt',
      modified_at: 1700002000000,
    },
  ],
};

vi.mock('../../../api/explorerApi', () => ({
  explorerApi: {
    getDefaultDirectory: vi.fn(async () => mockDefaultDir),
    readDirectory: vi.fn(async () => mockDirectoryContent),
    readTextFile: vi.fn(async () => 'Sample text file content'),
    createDirectory: vi.fn(async (parent, name) => `${parent}\\${name}`),
    renameItem: vi.fn(async (_path, name) => name),
    deleteItem: vi.fn(async () => {}),
    revealInFileManager: vi.fn(async () => {}),
    selectDirectory: vi.fn(async () => null),
  },
}));

describe('ExplorerScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('loads default directory and renders directory items and breadcrumbs', async () => {
    render(<ExplorerScreen />);

    await waitFor(() => {
      expect(screen.getAllByText('40Labs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
      expect(screen.getByText('patient_records.pdf')).toBeDefined();
      expect(screen.getByText('lab_notes.txt')).toBeDefined();
    });
  });

  test('filters displayed items when typing in search bar', async () => {
    render(<ExplorerScreen />);

    await waitFor(() => {
      expect(screen.getByText('patient_records.pdf')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search folder...');
    await userEvent.type(searchInput, 'notes');

    expect(screen.queryByText('patient_records.pdf')).toBeNull();
    expect(screen.getByText('lab_notes.txt')).toBeDefined();
  });

  test('double clicking a PDF file opens preview via openFile', async () => {
    render(<ExplorerScreen />);

    await waitFor(() => {
      expect(screen.getByText('patient_records.pdf')).toBeDefined();
    });

    const pdfItem = screen.getByText('patient_records.pdf');
    await userEvent.dblClick(pdfItem);

    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenCalledTimes(1);
      expect(mockOpenFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'patient_records.pdf',
          mimeType: 'application/pdf',
        })
      );
    });
  });

  test('double clicking a text file opens preview via openBlob', async () => {
    render(<ExplorerScreen />);

    await waitFor(() => {
      expect(screen.getByText('lab_notes.txt')).toBeDefined();
    });

    const txtItem = screen.getByText('lab_notes.txt');
    await userEvent.dblClick(txtItem);

    await waitFor(() => {
      expect(mockOpenBlob).toHaveBeenCalledTimes(1);
      expect(mockOpenBlob).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'lab_notes.txt',
          mimeType: 'text/plain',
        })
      );
    });
  });

  test('clicking New Folder opens modal and submits createDirectory', async () => {
    render(<ExplorerScreen />);

    await waitFor(() => {
      expect(screen.getByText('New Folder')).toBeDefined();
    });

    const newFolderBtn = screen.getByRole('button', { name: /new folder/i });
    await userEvent.click(newFolderBtn);

    expect(screen.getByText('Create New Folder')).toBeDefined();

    const folderInput = screen.getByPlaceholderText('New Folder');
    await userEvent.type(folderInput, 'Invoices');

    const submitBtn = screen.getByRole('button', { name: /create folder/i });
    await userEvent.click(submitBtn);

    const { explorerApi } = await import('../../../api/explorerApi');
    expect(explorerApi.createDirectory).toHaveBeenCalledWith(
      mockDefaultDir,
      'Invoices'
    );
  });
});
