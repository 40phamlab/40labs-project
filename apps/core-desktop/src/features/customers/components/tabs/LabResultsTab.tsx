import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Button } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { FlaskConical, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavStore } from '../../../../stores/useNavStore';
import { useLab } from '../../../../hooks/useLab';

interface LabResultsTabProps {
  customer: Customer;
}

export const LabResultsTab: React.FC<LabResultsTabProps> = ({ customer }) => {
  const setActiveScreen = useNavStore((s) => s.setActiveScreen);
  const { orders = [], results = [], catalog = [], isLoadingOrders, isOrdersError, refetchOrders } = useLab();

  const customerOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.customer_id === customer.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, customer.id]);

  if (isLoadingOrders) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Loading laboratory records...
      </div>
    );
  }

  if (isOrdersError) {
    return (
      <Panel className="p-6 text-center space-y-3 bg-panel border border-danger/30 rounded-card">
        <p className="text-xs text-danger">Failed to load lab results.</p>
        <Button intent="neutral" size="sm" onClick={() => refetchOrders()}>
          Retry
        </Button>
      </Panel>
    );
  }

  if (customerOrders.length === 0) {
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
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">Laboratory Orders & Results</h3>
        <Button
          intent="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => setActiveScreen('lab')}
        >
          New Lab Order
        </Button>
      </div>

      <div className="space-y-4">
        {customerOrders.map((ord) => {
          const testItem = catalog.find((c) => c.id === ord.test_catalog_id);
          const orderResults = results.filter((r) => r.lab_order_id === ord.id);

          return (
            <Panel key={ord.id} className="p-5 bg-panel rounded-card border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className="text-accent" />
                  <span className="font-bold text-text">{testItem?.name || 'Laboratory Test'}</span>
                  <span className="font-mono text-text-muted">({ord.id})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted font-mono">{formatDate(ord.created_at)}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ord.status === 'report_ready' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                    {ord.status}
                  </span>
                </div>
              </div>

              {orderResults.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {orderResults.map((res) => (
                    <div key={res.id} className="p-3 bg-panel-strong/30 rounded-card border border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {res.is_out_of_range ? (
                          <AlertCircle size={14} className="text-danger shrink-0" />
                        ) : (
                          <CheckCircle2 size={14} className="text-success shrink-0" />
                        )}
                        <span className="font-bold text-text">{res.value}</span>
                      </div>
                      <span className="text-text-muted font-mono text-[11px]">
                        Ref Range: {res.reference_range || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">Order status: {ord.status}. Results pending entry.</p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
};
