import * as React from 'react';
import { Chart, ChartPanel } from '@40labs/ui-components';
import {
  ReportCategoryId,
  ChartConfig,
  ChartDataPoint,
} from '../config/reportCategories';

export interface ReportChartRowProps {
  categoryId: ReportCategoryId;
  primaryConfig: ChartConfig;
  primaryData: ChartDataPoint[];
  className?: string;
}

export const ReportChartRow: React.FC<ReportChartRowProps> = ({
  categoryId,
  primaryConfig,
  primaryData,
  className = '',
}) => {
  const chartTriple = React.useMemo(() => {
    switch (categoryId) {
      case 'sales': {
        const lineData = primaryData.map((d) => ({
          label: d.label,
          avgOrderValue: d.count ? Math.round(Number(d.revenue) / Number(d.count)) : 0,
        }));

        return [
          {
            title: primaryConfig.title || 'Daily Sales Revenue',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: primaryConfig.dataKeys.map((dk) => ({
              dataKey: dk.key,
              name: dk.label,
              color: dk.color,
            })),
          },
          {
            title: 'Average Order Value Trend',
            type: 'line' as const,
            data: lineData,
            xAxisKey: 'label',
            series: [{ dataKey: 'avgOrderValue', name: 'Avg Value (TZS)', color: '#0ea5e9' }],
          },
          {
            title: 'Revenue Volume Distribution',
            type: 'area' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'revenue', name: 'Volume (TZS)', color: '#8b5cf6' }],
          },
        ];
      }

      case 'inventory': {
        return [
          {
            title: primaryConfig.title || 'Stock Valuation by Category',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: primaryConfig.dataKeys.map((dk) => ({
              dataKey: dk.key,
              name: dk.label,
              color: dk.color,
            })),
          },
          {
            title: 'Category Unit Density',
            type: 'area' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'units', name: 'Total Units', color: '#10b981' }],
          },
          {
            title: 'Batch Count by Category',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'items', name: 'Batches', color: '#f59e0b' }],
          },
        ];
      }

      case 'customers': {
        return [
          {
            title: primaryConfig.title || 'Top Customers by Period Spend',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: primaryConfig.dataKeys.map((dk) => ({
              dataKey: dk.key,
              name: dk.label,
              color: dk.color,
            })),
          },
          {
            title: 'Customer Spend Concentration',
            type: 'area' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'totalSpent', name: 'Spent (TZS)', color: '#0d9488' }],
          },
          {
            title: 'Customer Engagement Index',
            type: 'line' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'totalSpent', name: 'Activity Index', color: '#6366f1' }],
          },
        ];
      }

      case 'purchases': {
        return [
          {
            title: primaryConfig.title || 'Purchase Spend by Supplier',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: primaryConfig.dataKeys.map((dk) => ({
              dataKey: dk.key,
              name: dk.label,
              color: dk.color,
            })),
          },
          {
            title: 'Supplier Order Allocation',
            type: 'area' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'spend', name: 'Commitment (TZS)', color: '#d97706' }],
          },
          {
            title: 'Purchase Order Distribution',
            type: 'line' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'spend', name: 'PO Value', color: '#ec4899' }],
          },
        ];
      }

      case 'compliance':
      default: {
        return [
          {
            title: primaryConfig.title || 'Fiscal Receipt Status Breakdown',
            type: 'bar' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: primaryConfig.dataKeys.map((dk) => ({
              dataKey: dk.key,
              name: dk.label,
              color: dk.color,
            })),
          },
          {
            title: 'TRA Submission Outbox Queue',
            type: 'area' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'count', name: 'Receipts', color: '#16a34a' }],
          },
          {
            title: 'Audit Event Activity Rate',
            type: 'line' as const,
            data: primaryData,
            xAxisKey: 'label',
            series: [{ dataKey: 'count', name: 'Events', color: '#3b82f6' }],
          },
        ];
      }
    }
  }, [categoryId, primaryConfig, primaryData]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      {chartTriple.map((chartItem, idx) => (
        <ChartPanel key={`${categoryId}_chart_${idx}`} title={chartItem.title}>
          <Chart
            data={chartItem.data}
            type={chartItem.type}
            xAxisKey={chartItem.xAxisKey}
            series={chartItem.series}
            height={220}
            showLegend={false}
            showGrid={true}
          />
        </ChartPanel>
      ))}
    </div>
  );
};
