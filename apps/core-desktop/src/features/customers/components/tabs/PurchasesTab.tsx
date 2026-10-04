// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel } from '@40labs/ui-components';
import { ShoppingBag } from 'lucide-react';

interface PurchasesTabProps {
  customer: Customer;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = () => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-12 flex flex-col items-center justify-center text-center bg-panel rounded-card border border-border/50 gap-4">
        <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
          <ShoppingBag size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">No Purchase Records</h3>
          <p className="text-xs text-text-muted max-w-sm">
            TODO: [Linked via sales & supplier purchase history][MVP]
          </p>
        </div>
      </Panel>
    </div>
  );
};
