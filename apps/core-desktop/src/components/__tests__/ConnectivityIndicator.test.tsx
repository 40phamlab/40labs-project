import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectivityIndicator } from '../ConnectivityIndicator';
import { useConnectivityStore } from '../../stores/useConnectivityStore';

describe('ConnectivityIndicator', () => {
  beforeEach(() => {
    useConnectivityStore.setState({ status: 'online' });
  });

  test('renders online state with green token and correct aria-label', () => {
    useConnectivityStore.setState({ status: 'online' });
    render(<ConnectivityIndicator />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Network interface: Online');
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('renders offline state with neutral/muted token (never danger) and correct aria-label', () => {
    useConnectivityStore.setState({ status: 'offline' });
    render(<ConnectivityIndicator />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Network interface: Offline');
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Verify text is neutral/muted, not danger (bg-danger or text-danger)
    const labelSpan = screen.getByText('Offline');
    expect(labelSpan).toHaveClass('text-text-muted');
    expect(labelSpan).not.toHaveClass('text-danger');
  });
});
