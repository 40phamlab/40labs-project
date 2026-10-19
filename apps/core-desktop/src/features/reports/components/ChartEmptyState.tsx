import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { t } from '@40labs/i18n';

export interface ChartEmptyStateProps {
  className?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[320px] p-8 text-center bg-surface-primary/20 rounded-[12px] ${className}`}>
      <div className="w-12 h-12 rounded-full bg-success-bg text-action-primary flex items-center justify-center mb-3">
        <BarChart3 size={24} />
      </div>
      <h3 className="font-heading text-sm font-semibold text-text-primary">
        {t('reports.empty.title')}
      </h3>
    </div>
  );
};
