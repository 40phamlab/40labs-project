// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button } from '@40labs/ui-components';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';

interface LabResultsTabProps {
  customer: Customer;
}

export const LabResultsTab: React.FC<LabResultsTabProps> = () => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-12 flex flex-col items-center justify-center text-center bg-panel rounded-card border border-border/50 gap-4">
        <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
          <FlaskConical size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">No Lab Results</h3>
          <p className="text-xs text-text-muted max-w-sm">
            No laboratory orders or test results are currently linked to this customer.
          </p>
        </div>
        <Button
          intent="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => setActiveScreen('lab')}
        >
          Order a lab test
        </Button>
      </Panel>
    </div>
  );
};
