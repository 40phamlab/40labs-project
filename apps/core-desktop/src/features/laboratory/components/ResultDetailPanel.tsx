import * as React from 'react';
import { Drawer, Badge } from '@40labs/ui-components';
import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';
import { formatDateTime } from '@40labs/i18n';
import { ExpiryChip } from './ExpiryChip';
import { ExportMenu } from './ExportMenu';
import { User, TestTube, FileText, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export interface ResultDetailPanelProps {
  result: LabResult | null;
  orders: LabOrder[];
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  samples: LabSample[];
  isOpen: boolean;
  onClose: () => void;
}

export const ResultDetailPanel: React.FC<ResultDetailPanelProps> = ({
  result,
  orders,
  customers,
  testCatalog,
  samples,
  isOpen,
  onClose,
}) => {
  if (!result) return null;

  const order = orders.find((o) => o.id === result.lab_order_id);
  const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
  const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
  const sample = samples.find((s) => s.lab_order_id === result.lab_order_id);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Laboratory Result Detail" width="lg">
      <div className="flex flex-col gap-6 p-6">
        {/* Header & Export Actions */}
        <div className="flex justify-between items-center bg-panel p-4 rounded-card border border-border/50">
          <div>
            <span className="text-xs font-mono text-text-muted">RESULT ID</span>
            <p className="text-base font-bold font-mono text-text">{result.id}</p>
          </div>
          <ExportMenu
            results={[result]}
            orders={orders}
            customers={customers}
            testCatalog={testCatalog}
            samples={samples}
            singleResult={result}
          />
        </div>

        {/* Patient & Order info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-panel-strong/40 rounded-card border border-border/50 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <User size={14} /> Patient Information
            </div>
            <p className="font-bold text-text">{customer?.full_name || 'Patient record missing'}</p>
            <p className="text-xs text-text-muted">Phone: {customer?.phone || '—'}</p>
            <p className="text-xs text-text-muted">Email: {customer?.email || '—'}</p>
          </div>

          <div className="p-4 bg-panel-strong/40 rounded-card border border-border/50 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <TestTube size={14} /> Sample & Test
            </div>
            <p className="font-bold text-text">{test?.name || 'Test record missing'}</p>
            <p className="text-xs text-text-muted">Category: {test?.category || 'General'}</p>
            <p className="text-xs text-text-muted font-mono">Sample Label: {sample?.sample_label || order?.id || '—'}</p>
          </div>
        </div>

        {/* Expiry Status */}
        {sample && (
          <div className="flex items-center justify-between p-4 bg-panel rounded-card border border-border/50">
            <span className="text-xs font-medium text-text-muted">Sample Viability & Expiry</span>
            <ExpiryChip sample={sample} />
          </div>
        )}

        {/* Result Values & Flags */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-text flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Measured Values & Reference Ranges
          </h4>
          <div className="p-5 rounded-card bg-panel border border-border/60 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-panel-strong/40 rounded-md">
                <span className="text-xs text-text-muted block mb-1">Measured Value</span>
                <span className="text-xl font-bold font-mono text-text">{result.value}</span>
              </div>
              <div className="p-3 bg-panel-strong/40 rounded-md">
                <span className="text-xs text-text-muted block mb-1">Reference Range</span>
                <span className="text-sm font-mono font-medium text-text">{result.reference_range || test?.reference_range || 'N/A'}</span>
              </div>
              <div className="p-3 bg-panel-strong/40 rounded-md flex flex-col items-center justify-center">
                <span className="text-xs text-text-muted block mb-1">Clinical Flag</span>
                {result.is_out_of_range ? (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle size={12} /> Out of Range (High/Low)
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 size={12} /> Normal
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audit & Entry Metadata */}
        <div className="flex flex-col gap-2 text-xs p-4 bg-panel-strong/30 rounded-card border border-border/40">
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Entered By User ID</span>
            <span className="font-mono text-text">{result.entered_by_user_id}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Entered At Timestamp</span>
            <span className="font-mono text-text">{formatDateTime(result.created_at) || result.created_at}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
