import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button, MoneyDisplay } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';
import { useSales } from '../../../../hooks/useSales';

interface PurchasesTabProps {
  customer: Customer;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({ customer }) => {
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
        Loading purchase records...
      </div>
    );
  }

  if (isSalesError) {
    return (
      <Panel className="p-6 text-center space-y-3 bg-panel border border-danger/30 rounded-card">
        <p className="text-xs text-danger">Failed to load purchase records: {salesError?.message}</p>
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
            <ShoppingBag size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text">No Purchase Records</h3>
            <p className="text-xs text-text-muted max-w-sm">
              No sales transactions have been linked to this customer account.
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
        <h3 className="text-sm font-bold text-text">Customer Purchase Ledger</h3>
        <Button
          intent="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => setActiveScreen('sales')}
        >
          New Sale
        </Button>
      </div>

      <div className="space-y-3">
        {customerSales.map((sale) => (
          <Panel key={sale.id} className="p-4 bg-panel rounded-card border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded bg-panel-strong flex items-center justify-center text-accent font-mono font-bold">
                <ShoppingBag size={16} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-text">{sale.id}</span>
                  <span className="capitalize px-2 py-0.2 rounded bg-panel-strong text-[10px] font-semibold text-text-muted">
                    {sale.payment_method.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-text-muted font-mono">{formatDate(sale.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-text-muted">
                {sale.lines?.length || 0} {sale.lines?.length === 1 ? 'item' : 'items'}
              </span>
              <MoneyDisplay amount={sale.grand_total} emphasis="strong" className="font-mono text-sm" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};
