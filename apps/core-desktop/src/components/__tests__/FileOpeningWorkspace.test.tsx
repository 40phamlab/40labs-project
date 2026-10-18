import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

vi.mock('../../api/explorerApi', () => ({
  explorerApi: {
    getDefaultDirectory: vi.fn(async () => 'C:\\Docs'),
    readDirectory: vi.fn(async () => ({ current_path: 'C:\\Docs', parent_path: 'C:', items: [] })),
  },
}));

vi.mock('../../api/client', () => ({
  isUsingTauriIpc: () => false,
  isTauriAvailable: () => false,
  invokeCommand: vi.fn(),
}));

describe('Integrated File Opening Workspace & Document Lifecycle', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  test('App renders default dashboard screen when no files are open', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('40Labs')).toBeDefined();
    });
  });
});
