import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConnectivityIndicator } from '../ConnectivityIndicator';
import { useConnectivityStore } from '../../stores/useConnectivityStore';
import { t } from '@40labs/i18n';

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
    const expectedAria = t('connectivity.ariaOnline', 'en');
    const expectedText = t('connectivity.online', 'en');

    expect(indicator.getAttribute('aria-label')).toBe(expectedAria);
    expect(screen.getByText(expectedText)).toBeDefined();
  });

  test('renders offline state with neutral/muted token (never danger) and correct aria-label', () => {
    useConnectivityStore.setState({ status: 'offline' });
    render(<ConnectivityIndicator />);

    const indicator = screen.getByRole('status');
    const expectedAria = t('connectivity.ariaOffline', 'en');
    const expectedText = t('connectivity.offline', 'en');

    expect(indicator.getAttribute('aria-label')).toBe(expectedAria);
    expect(screen.getByText(expectedText)).toBeDefined();

    const labelSpan = screen.getByText(expectedText);
    expect(labelSpan.className).toContain('text-text-muted');
    expect(labelSpan.className).not.toContain('text-danger');
  });
});
