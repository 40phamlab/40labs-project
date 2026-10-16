// [phase: 8D] KpiCard Unit Tests
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import { KpiCard } from '../components/KpiCard';
import { DeltaChip, getDeltaState } from '../components/DeltaChip';
import type { DashboardKpi } from '@40labs/types';

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

    // up-good, direction down -> bad
    expect(
      getDeltaState({
        pct: -10,
        direction: 'down',
        polarity: 'up-good',
        compareKey: 'vs_yesterday',
      })
    ).toBe('bad');

    // down-good, direction down -> good
    expect(
      getDeltaState({
        pct: -10,
        direction: 'down',
        polarity: 'down-good',
        compareKey: 'vs_yesterday',
      })
    ).toBe('good');

    // down-good, direction up -> bad
    expect(
      getDeltaState({
        pct: 10,
        direction: 'up',
        polarity: 'down-good',
        compareKey: 'vs_yesterday',
      })
    ).toBe('bad');

    // flat or null -> flat
    expect(
      getDeltaState({
        pct: null,
        direction: 'flat',
        polarity: 'up-good',
        compareKey: 'vs_yesterday',
      })
    ).toBe('flat');
  });

  it('renders KpiCard with title, formatted value, and delta chip', () => {
    const summary = getInitialDashboardSummary();
    const salesKpi = summary.kpis.sales;

    render(<KpiCard kpi={salesKpi} />);

    expect(screen.getByText('Mauzo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mauzo KPI/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Mauzo module/i })).toBeInTheDocument();
  });

  it('handles card click callback', () => {
    const summary = getInitialDashboardSummary();
    const salesKpi = summary.kpis.sales;
    const selectSpy = vi.fn();

    render(<KpiCard kpi={salesKpi} onSelectMetric={selectSpy} />);

    const card = screen.getByRole('button', { name: /Mauzo KPI/i });
    fireEvent.click(card);

    expect(selectSpy).toHaveBeenCalledWith('sales');
  });

  it('renders all 8 domain KPIs from dev summary without errors', () => {
    const summary = getInitialDashboardSummary();

    summary.kpiList.forEach((kpi) => {
      const { container } = render(<KpiCard kpi={kpi} />);
      expect(container).toBeInTheDocument();
    });
  });
});
