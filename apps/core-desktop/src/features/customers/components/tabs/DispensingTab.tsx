// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button } from '@40labs/ui-components';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';

interface DispensingTabProps {
  customer: Customer;
}

export const DispensingTab: React.FC<DispensingTabProps> = () => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-12 flex flex-col items-center justify-center text-center bg-panel rounded-card border border-border/50 gap-4">
        <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
          <ShoppingCart size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">No Dispensing History</h3>
          <p className="text-xs text-text-muted max-w-sm">
            This customer has no prior dispensing records linked in the sales ledger.
          </p>
        </div>
        <Button
          intent="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => setActiveScreen('sales')}
        >
          Start a sale
        </Button>
      </Panel>
    </div>
  );
};
