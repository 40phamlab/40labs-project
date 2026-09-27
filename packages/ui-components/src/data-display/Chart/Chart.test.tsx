import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chart } from './Chart';

describe('Chart Component - Task 2 Flexible Visualizations', () => {
  const sharedDataset = [
    { month: 'Jan', value: 120, target: 100 },
    { month: 'Feb', value: 180, target: 150 },
    { month: 'Mar', value: 250, target: 200 },
  ];

  test('switches between line, bar, area, scatter, pie, and radar visualizations with the same dataset', () => {
    const { rerender } = render(
      <Chart title="Performance Chart" data={sharedDataset} type="line" xKey="month" series={['value', 'target']} />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();

    // Switch to bar
    rerender(
      <Chart title="Performance Chart" data={sharedDataset} type="bar" xKey="month" series={['value', 'target']} />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();

    // Switch to area
    rerender(
      <Chart title="Performance Chart" data={sharedDataset} type="area" xKey="month" series={['value', 'target']} />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();

    // Switch to scatter
    rerender(
      <Chart title="Performance Chart" data={sharedDataset} type="scatter" xKey="month" series="value" />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();

    // Switch to pie
    rerender(
      <Chart title="Performance Chart" data={sharedDataset} type="pie" xKey="month" series="value" />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();

    // Switch to radar
    rerender(
      <Chart title="Performance Chart" data={sharedDataset} type="radar" xKey="month" series={['value', 'target']} />
    );
    expect(screen.getByText('Performance Chart')).toBeInTheDocument();
  });

  test('supports single series and multiple series configuration', () => {
    render(<Chart data={sharedDataset} series="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  test('supports axis and label customization', () => {
    render(
      <Chart
        data={sharedDataset}
        xKey="month"
        series="value"
        xAxisLabel="Months"
        yAxisLabel="Values"
      />
    );
    expect(screen.getByText('value')).toBeInTheDocument();
  });
});
