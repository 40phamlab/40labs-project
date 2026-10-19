import * as React from 'react';
import { Switch, Button } from '@40labs/ui-components';
import { PeriodSelector, PeriodOption } from './PeriodSelector';
import { SlidersHorizontal, Eye } from 'lucide-react';

export interface ReportsFilterBarProps {
  periodValue: PeriodOption;
  onPeriodChange: (option: PeriodOption, range: { start: Date; end: Date }) => void;
  compare: boolean;
  onCompareChange: (compare: boolean) => void;
  onOpenEditor: () => void;
  onOpenPreview: () => void;
}

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  periodValue,
  onPeriodChange,
  compare,
  onCompareChange,
  onOpenEditor,
  onOpenPreview,
}) => {
  return (
    <div className="flex items-center justify-between w-full px-1 py-2 gap-3 bg-surface-primary/60 rounded-[8px] shrink-0">
      <div className="flex items-center gap-3">
        <PeriodSelector value={periodValue} onChange={onPeriodChange} />
        <div className="flex items-center gap-2 px-2 py-1 rounded-[8px] bg-surface-elevated border border-border">
          <span className="text-xs font-ui text-text-secondary">Compare</span>
          <Switch checked={compare} onChange={onCompareChange} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          intent="neutral"
          size="sm"
          leftIcon={<SlidersHorizontal size={14} />}
          onClick={onOpenEditor}
        >
          Editor
        </Button>
        <Button
          type="button"
          intent="neutral"
          size="sm"
          leftIcon={<Eye size={14} />}
          onClick={onOpenPreview}
        >
          Preview
        </Button>
      </div>
    </div>
  );
};
