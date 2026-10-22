// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { StatusBadge } from '@40labs/ui-components';

export interface StockChipProps {
  stock: 'in' | 'low' | 'out';
  className?: string;
}

export const StockChip: React.FC<StockChipProps> = ({ stock, className = '' }) => {
  let status: 'success' | 'warning' | 'error' = 'success';
  if (stock === 'low') status = 'warning';
  else if (stock === 'out') status = 'error';

  return (
    <div className={className}>
      <StatusBadge status={status} label={stock.toUpperCase()} />
    </div>
  );
};
