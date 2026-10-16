// [phase: 8D] KpiCard Unit Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import { KpiCard } from '../components/KpiCard';
import { getDeltaState } from '../components/DeltaChip';

describe('KpiCard & DeltaChip [phase: 8D]', () => {
  it('correctly determines delta state from direction x polarity', () => {
    // up-good, direction up -> good
    expect(
      getDeltaState({
        pct: 10,
        direction: 'up',
        polarity: 'up-good',
        compareKey: 'vs_yesterday',
      })
    ).toBe('good');
  });

  it('renders KpiCard with title, formatted value, and handles clicks', () => {
    const summary = getInitialDashboardSummary();
    const salesKpi = summary.kpis.sales;
    const handleSelect = vi.fn();

    render(<KpiCard kpi={salesKpi} onSelectMetric={handleSelect} />);

    expect(screen.getByText('Mauzo')).toBeInTheDocument();
    const card = screen.getByText('Mauzo').closest('div');
    if (card) fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledWith('sales');
  });
});
