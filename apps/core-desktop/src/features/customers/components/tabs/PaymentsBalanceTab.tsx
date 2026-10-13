import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button, MoneyDisplay } from '@40labs/ui-components';
import { formatDate, formatMoney } from '@40labs/i18n';
import { CreditCard, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';
import { useSales } from '../../../../hooks/useSales';

interface PaymentsBalanceTabProps {
  customer: Customer;
  onRecordPayment?: () => void;
}

export const PaymentsBalanceTab: React.FC<PaymentsBalanceTabProps> = ({ customer, onRecordPayment }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const { completedSales = [], isLoadingSales } = useSales();

  const customerSales = React.useMemo(() => {
    return completedSales
      .filter((s) => s.customer_id === customer.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [completedSales, customer.id]);

  const totalSpent = React.useMemo(() => {
    return customerSales.reduce((acc, s) => acc + s.grand_total, 0);
  }, [customerSales]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-text">Customer Financial Ledger</h3>
          <span className="text-xs text-text-muted">Outstanding balance and transaction ledger</span>
        </div>
        <Button
          intent="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onRecordPayment || (() => setActiveScreen('sales'))}
        >
          Record Payment / Sale
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <Panel className="p-6 flex items-center justify-between bg-panel rounded-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-panel-strong flex items-center justify-center text-accent">
              <CreditCard size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-muted font-bold uppercase">Outstanding Debt Balance</span>
              <span className="text-xs text-text-muted">Current unpaid customer debt</span>
            </div>
          </div>
          <MoneyDisplay
            amount={customer.outstanding_balance}
            colorize={customer.outstanding_balance > 0}
            emphasis="strong"
            className="text-lg font-mono"
          />
        </Panel>

        <Panel className="p-6 flex items-center justify-between bg-panel rounded-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-panel-strong flex items-center justify-center text-success">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-muted font-bold uppercase">Total Lifetime Sales Value</span>
              <span className="text-xs text-text-muted">Sum of all completed purchases</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-text">
            {formatMoney(totalSpent)} TZS
          </span>
        </Panel>
      </div>

      {/* Ledger Transactions */}
      {isLoadingSales ? (
        <div className="p-8 text-center text-xs text-text-muted">
          Loading financial ledger...
        </div>
      ) : customerSales.length === 0 ? (
        <Panel className="p-8 flex flex-col items-center justify-center text-center bg-panel rounded-card border border-border/50 gap-2">
          <p className="text-xs text-text-muted italic">No financial ledger transactions recorded for this customer.</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Ledger History</h4>
          {customerSales.map((sale) => (
            <Panel key={sale.id} className="p-4 bg-panel rounded-card border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <ArrowUpRight size={16} className={sale.payment_method === 'credit' ? 'text-warning' : 'text-success'} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text">{sale.id}</span>
                    <span className="capitalize text-text-muted font-mono text-[11px]">
                      ({sale.payment_method.replace('_', ' ')})
                    </span>
                  </div>
                  <span className="text-text-muted font-mono">{formatDate(sale.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-text">
                  {formatMoney(sale.grand_total)} TZS
                </span>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
