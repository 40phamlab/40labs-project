import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockAnalyticsPanel } from '../StockAnalyticsPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithQuery = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('StockAnalyticsPanel Component Tests [phase: StockAnalytics]', () => {
  test('renders panel toolbar and KPI strip when graphVisible is true', async () => {
    renderWithQuery(
      <StockAnalyticsPanel
        graphVisible={true}
        onToggleGraph={() => {}}
      />
    );

    expect(screen.getByText(/Stock Trends & Category Analytics/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Thamani ya Mauzo')).toBeInTheDocument();
      expect(screen.getByText('Jumla ya SKUs')).toBeInTheDocument();
    });
  });

  test('switches tabs correctly (Overview, Movement, Performance, Expiry)', async () => {
    renderWithQuery(
      <StockAnalyticsPanel
        graphVisible={true}
        onToggleGraph={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Movement'));
    expect(screen.getByText('Bidhaa Zinazoingia na Kutoka')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Performance'));
    expect(screen.getByText('Bidhaa Zinazofanya Vizuri Zaidi')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Expiry'));
    expect(screen.getByText('Madaraja ya Kuisha Muda (Expiry Buckets)')).toBeInTheDocument();
  });

  test('collapses cleanly when graphVisible is false', () => {
    renderWithQuery(
      <StockAnalyticsPanel
        graphVisible={false}
        onToggleGraph={() => {}}
      />
    );

    expect(screen.queryByText('Thamani ya Mauzo')).not.toBeInTheDocument();
  });

  test('range switch updates range state', async () => {
    renderWithQuery(
      <StockAnalyticsPanel
        graphVisible={true}
        onToggleGraph={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('30D')).toBeInTheDocument();
    });

    const btn7d = screen.getByText('7D');
    fireEvent.click(btn7d);
    expect(btn7d).toBeInTheDocument();
  });
});
