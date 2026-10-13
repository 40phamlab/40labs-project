import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button, MoneyDisplay } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { ShoppingCart, ArrowRight, Pill } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';
import { useSales } from '../../../../hooks/useSales';

interface DispensingTabProps {
  customer: Customer;
}

export const DispensingTab: React.FC<DispensingTabProps> = ({ customer }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const { completedSales = [], isLoadingSales, isSalesError, salesError, refetchSales } = useSales();

  const customerSales = React.useMemo(() => {
    return completedSales
      .filter((s) => s.customer_id === customer.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [completedSales, customer.id]);

  if (isLoadingSales) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Loading dispensing records...
      </div>
    );
  }

  if (isSalesError) {
    return (
      <Panel className="p-6 text-center space-y-3 bg-panel border border-danger/30 rounded-card">
        <p className="text-xs text-danger">Failed to load dispensing records: {salesError?.message}</p>
        <Button intent="neutral" size="sm" onClick={() => refetchSales()}>
          Retry
        </Button>
      </Panel>
    );
  }

  if (customerSales.length === 0) {
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
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">Dispensing & Sales History</h3>
        <Button
          intent="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => setActiveScreen('sales')}
        >
          New Sale / Dispense
        </Button>
      </div>

      <div className="space-y-4">
        {customerSales.map((sale) => (
          <Panel key={sale.id} className="p-5 bg-panel rounded-card border border-border space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-accent" />
                <span className="font-mono font-bold text-text">{sale.id}</span>
                <span className="text-text-muted">• {formatDate(sale.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="capitalize px-2 py-0.5 rounded bg-panel-strong text-[11px] font-semibold text-text">
                  {sale.payment_method.replace('_', ' ')}
                </span>
                <MoneyDisplay amount={sale.grand_total} emphasis="strong" className="font-mono text-sm" />
              </div>
            </div>

            {sale.lines && sale.lines.length > 0 ? (
              <div className="space-y-1 text-xs">
                {sale.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between py-1 text-text">
                    <span>
                      {line.medicine_id || 'Dispensed Item'} <span className="text-text-muted">x{line.quantity}</span>
                    </span>
                    <MoneyDisplay amount={line.subtotal} className="font-mono text-text-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">Sale completed with total {sale.grand_total} TZS</p>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
};
