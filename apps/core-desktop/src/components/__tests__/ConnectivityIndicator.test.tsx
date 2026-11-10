import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConnectivityIndicator } from '../ConnectivityIndicator';
import { useConnectivityStore } from '../../stores/useConnectivityStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'connectivity.online': 'Online',
        'connectivity.offline': 'Offline',
        'connectivity.ariaOnline': 'Network Status: Online',
        'connectivity.ariaOffline': 'Network Status: Offline',
      };
      return map[key] || key;
    },
  }),
}));

describe('ConnectivityIndicator', () => {
  beforeEach(() => {
    useConnectivityStore.setState({ status: 'online' });
  });

  afterEach(() => {
    cleanup();
  });

  test('renders online state with green token and correct aria-label', () => {
    useConnectivityStore.setState({ status: 'online' });
    render(<ConnectivityIndicator />);

    const indicator = screen.getByRole('status');
    const expectedAria = 'Network Status: Online';
    const expectedText = 'Online';

    expect(indicator.getAttribute('aria-label')).toBe(expectedAria);
    expect(screen.getByText(expectedText)).toBeDefined();
  });

  test('renders offline state with neutral/muted token (never danger) and correct aria-label', () => {
    useConnectivityStore.setState({ status: 'offline' });
    render(<ConnectivityIndicator />);

    const indicator = screen.getByRole('status');
    const expectedAria = 'Network Status: Offline';
    const expectedText = 'Offline';

    expect(indicator.getAttribute('aria-label')).toBe(expectedAria);
    expect(screen.getByText(expectedText)).toBeDefined();

    const labelSpan = screen.getByText(expectedText);
    expect(labelSpan.className).toContain('text-text-muted');
    expect(labelSpan.className).not.toContain('text-danger');
  });
});
