import * as React from 'react';
import { Metric } from '@40labs/ui-components';
import { KpiItem } from '../config/reportCategories';

export interface ReportSummaryStripProps {
  kpis: KpiItem[];
  className?: string;
}

export const ReportSummaryStrip: React.FC<ReportSummaryStripProps> = ({ kpis, className = '' }) => {
  if (!kpis || kpis.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpis.map((kpi) => (
        <Metric
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          subtext={kpi.subtext}
          trend={
            kpi.trend && kpi.trend !== 'neutral'
              ? { value: 8, isUp: kpi.trend === 'up' }
              : undefined
          }
        />
      ))}
    </div>
  );
};
