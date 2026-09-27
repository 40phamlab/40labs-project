import * as React from 'react';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from './types';
import { LineChartRenderer } from './renderers/LineChartRenderer';
import { BarChartRenderer } from './renderers/BarChartRenderer';
import { AreaChartRenderer } from './renderers/AreaChartRenderer';
import { ScatterChartRenderer } from './renderers/ScatterChartRenderer';
import { PieChartRenderer } from './renderers/PieChartRenderer';
import { RadarChartRenderer } from './renderers/RadarChartRenderer';

export const defaultChartColors = [
  colors.primary,    // #16A34A (Green)
  colors.accent,     // #F97316 (Orange)
  colors.info,       // #0EA5E9 (Blue)
  colors.warning,    // #F97316
  colors.danger,     // #EF4444 (Red)
  '#8B5CF6',         // Violet
  '#EC4899',         // Pink
  '#14B8A6',         // Teal
  '#6366F1',         // Indigo
];

export function Chart<T extends Record<string, any> = Record<string, any>>({
  data = [],
  type = 'line',
  xAxisKey,
  xKey,
  series,
  height = 300,
  width = '100%',
  showTooltip = true,
  showLegend = true,
  showGrid = true,
  colors: customColors,
  title,
  subtitle,
  className = '',
  emptyMessage = 'No chart data available',
  loading = false,
  loadingMessage = 'Loading chart data...',
  error,
  onDataClick,
  innerRadius,
  outerRadius,
  layout = 'horizontal',
  stacked = false,
  tooltipFormatter,
  xAxisLabel,
  yAxisLabel,
  xAxisFormatter,
  yAxisFormatter,
}: ChartProps<T>) {
  const palette = customColors || defaultChartColors;

  // Auto-detect or resolve xAxisKey (supporting xKey and xAxisKey aliases)
  const resolvedXAxisKey = React.useMemo(() => {
    if (xKey) return xKey;
    if (xAxisKey) return xAxisKey;
    if (data.length > 0) {
      const firstItem = data[0];
      const keys = Object.keys(firstItem);
      const nonNumericKey = keys.find((k) => typeof firstItem[k] !== 'number');
      return nonNumericKey || keys[0] || 'name';
    }
    return 'name';
  }, [xKey, xAxisKey, data]);

  // Auto-detect or resolve series
  const resolvedSeries = React.useMemo<ChartSeries[]>(() => {
    if (series) {
      if (typeof series === 'string') {
        return [{ dataKey: series }];
      }
      if (Array.isArray(series)) {
        return series.map((s) => (typeof s === 'string' ? { dataKey: s } : s));
      }
      return [series];
    }

    if (data.length > 0) {
      const firstItem = data[0];
      const keys = Object.keys(firstItem);
      const dataKeys = keys.filter((k) => k !== resolvedXAxisKey);
      if (dataKeys.length > 0) {
        return dataKeys.map((k) => ({ dataKey: k, name: k }));
      }
    }

    return [{ dataKey: 'value', name: 'Value' }];
  }, [series, data, resolvedXAxisKey]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-ui">{loadingMessage}</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-danger gap-2">
          <span className="text-xs font-ui font-semibold">{error}</span>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
          <span className="text-xs font-ui">{emptyMessage}</span>
        </div>
      );
    }

    const commonProps = {
      data,
      resolvedSeries,
      resolvedXAxisKey,
      height,
      width,
      showTooltip,
      showLegend,
      showGrid,
      palette,
      onDataClick,
      innerRadius,
      outerRadius,
      layout,
      stacked,
      tooltipFormatter,
      xAxisLabel,
      yAxisLabel,
      xAxisFormatter,
      yAxisFormatter,
    };

    switch (type) {
      case 'bar':
        return <BarChartRenderer {...commonProps} />;
      case 'area':
        return <AreaChartRenderer {...commonProps} />;
      case 'scatter':
        return <ScatterChartRenderer {...commonProps} />;
      case 'pie':
        return <PieChartRenderer {...commonProps} />;
      case 'radar':
        return <RadarChartRenderer {...commonProps} />;
      case 'line':
      default:
        return <LineChartRenderer {...commonProps} />;
    }
  };

  return (
    <div
      className={`bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4 flex flex-col gap-0.5">
          {title && <h3 className="font-heading text-sm font-semibold text-text">{title}</h3>}
          {subtitle && <p className="font-ui text-xs text-text-muted">{subtitle}</p>}
        </div>
      )}
      <div className="w-full" style={{ minHeight: typeof height === 'number' ? height : 300 }}>
        {renderContent()}
      </div>
    </div>
  );
}
