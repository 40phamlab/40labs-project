import * as React from 'react';
import { Badge } from '@40labs/ui-components';

export interface UnitChipProps {
  unit?: string;
  className?: string;
}

export const UnitChip: React.FC<UnitChipProps> = ({ unit, className = '' }) => {
  if (!unit) return null;
  return (
    <Badge variant="neutral" className={`shrink-0 text-[8px] opacity-70 px-1 py-0 h-3.5 flex items-center ${className}`}>
      {unit}
    </Badge>
  );
};
