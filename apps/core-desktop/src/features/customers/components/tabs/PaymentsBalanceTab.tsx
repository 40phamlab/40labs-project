// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button, MoneyDisplay } from '@40labs/ui-components';
import { CreditCard, Plus } from 'lucide-react';

interface PaymentsBalanceTabProps {
  customer: Customer;
  onRecordPayment?: () => void;
}

export const PaymentsBalanceTab: React.FC<PaymentsBalanceTabProps> = ({ customer, onRecordPayment }) => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-text">Customer Ledger</h3>
          <span className="text-xs text-text-muted">Outstanding balance and payment history</span>
        </div>
        <Button
          intent="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onRecordPayment}
        >
          Record payment
        </Button>
      </div>

      <Panel className="p-6 flex items-center justify-between bg-panel rounded-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-panel-strong flex items-center justify-center text-accent">
            <CreditCard size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-bold uppercase">Current Outstanding Balance</span>
            <span className="text-xs text-text-muted">Updated in real-time from ledger</span>
          </div>
        </div>
        <MoneyDisplay
          amount={customer.outstanding_balance}
          colorize={customer.outstanding_balance > 0}
          emphasis="strong"
          className="text-lg"
        />
      </Panel>

      <Panel className="p-8 flex flex-col items-center justify-center text-center bg-panel rounded-card border border-border/50 gap-2">
        <p className="text-xs text-text-muted italic">No payment transactions recorded yet in this workspace session.</p>
      </Panel>
    </div>
  );
};
