import * as React from 'react';
import { KPITile } from '@40labs/ui-components';
import { KpiItem } from '../config/reportCategories';
import { Activity, DollarSign, Package, Users } from 'lucide-react';

export interface ReportsKpiRowProps {
  kpis: KpiItem[];
  className?: string;
}

const defaultIcons = [<DollarSign size={16} />, <Activity size={16} />, <Package size={16} />, <Users size={16} />];

export const ReportsKpiRow: React.FC<ReportsKpiRowProps> = ({ kpis, className = '' }) => {
  if (!kpis || kpis.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpis.map((kpi, index) => (
        <div key={kpi.id} title={kpi.subtext || kpi.label} className="cursor-help">
          <KPITile
            title={kpi.label}
            value={kpi.value}
            subtext={kpi.subtext}
            icon={defaultIcons[index % defaultIcons.length]}
            tone={kpi.trend === 'up' ? 'primary' : kpi.trend === 'down' ? 'danger' : 'default'}
            trendPercentage={kpi.trend ? 5 : undefined}
            trendDirection={kpi.trend === 'down' ? 'down' : 'up'}
          />
        </div>
      ))}
    </div>
  );
};
