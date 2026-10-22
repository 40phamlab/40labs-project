import * as React from 'react';
import {
  Button,
  Modal,
  Field,
  FieldLabel,
  Input,
  Badge,
} from '@40labs/ui-components';
import type { LabReport, LabOrder, Customer, LabResult, TestCatalogEntry, LabSample } from '@40labs/types';
import { ExportMenu } from '../components/ExportMenu';
import { ForwardReportDialog } from './ForwardReportDialog';
import { createResultPdfBlob } from '../export/resultPdf';
import { FileText, CheckCircle2, AlertTriangle, Send, Lock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  orders: LabOrder[];
  customers: Customer[];
  results: LabResult[];
  testCatalog: TestCatalogEntry[];
  samples: LabSample[];
  users: any[];
  onCreateReport: (payload: { patientId: string; orderId: string; summaryNote?: string; resultIds: string[] }) => Promise<LabReport>;
  onFinalizeReport: (reportId: string, pin: string, summaryNote?: string) => Promise<LabReport>;
  onAmendReport: (reportId: string, pin: string, summaryNote?: string, resultIds?: string[]) => Promise<LabReport>;
  onForwardReport: (reportId: string, toUserId: string, note?: string) => Promise<unknown>;
  existingReport?: LabReport | null;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  results,
  testCatalog,
  samples,
  users,
  onCreateReport,
  onFinalizeReport,
  onAmendReport,
  onForwardReport,
  existingReport,
}) => {
  const [selectedOrderId, setSelectedOrderId] = React.useState('');
  const [summaryNote, setSummaryNote] = React.useState('');
  const [selectedResultIds, setSelectedResultIds] = React.useState<string[]>([]);
  const [activeReport, setActiveReport] = React.useState<LabReport | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [pinAction, setPinAction] = React.useState<'finalize' | 'amend'>('finalize');
  const [pin, setPin] = React.useState('');
  const [isForwardOpen, setIsForwardOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (existingReport) {
      setActiveReport(existingReport);
      setSelectedOrderId(existingReport.order_id);
      setSummaryNote(existingReport.summary_note || '');
    } else {
      setActiveReport(null);
      setSelectedOrderId('');
      setSummaryNote('');
      setSelectedResultIds([]);
    }
    setError(null);
  }, [isOpen, existingReport]);

  const orderResults = React.useMemo(() => {
    if (!selectedOrderId) return [];
    return results.filter((r) => r.lab_order_id === selectedOrderId);
  }, [results, selectedOrderId]);

  // When order changes, default select all its results if creating
  React.useEffect(() => {
    if (!existingReport && selectedOrderId) {
      setSelectedResultIds(orderResults.map((r) => r.id));
    }
  }, [selectedOrderId, orderResults, existingReport]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const customer = selectedOrder ? customers.find((c) => c.id === selectedOrder.customer_id) : undefined;

  const handleSaveDraft = async () => {
    if (!selectedOrder || !customer) {
      setError('Please select a valid order and patient.');
      return;
    }
    if (selectedResultIds.length === 0) {
      setError('Please select at least one test result for this report.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rep = await onCreateReport({
        patientId: customer.id,
        orderId: selectedOrder.id,
        summaryNote: summaryNote.trim() || undefined,
        resultIds: selectedResultIds,
      });
      setActiveReport(rep);
    } catch (err: any) {
      setError(err?.message || 'Failed to save draft report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePinAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    if (!pin.trim() || pin.length !== 6) {
      setError('A valid 6-digit PIN is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (pinAction === 'finalize') {
        const finalized = await onFinalizeReport(activeReport.id, pin.trim(), summaryNote.trim() || undefined);
        setActiveReport(finalized);
      } else {
        const amended = await onAmendReport(activeReport.id, pin.trim(), summaryNote.trim() || undefined, selectedResultIds);
        setActiveReport(amended);
      }
      setIsPinModalOpen(false);
      setPin('');
    } catch (err: any) {
      setError(err?.message || 'PIN verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const next = [...selectedResultIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSelectedResultIds(next);
  };

  const removeItem = (id: string) => {
    setSelectedResultIds(selectedResultIds.filter((rId) => rId !== id));
  };

  const isFinalized = activeReport?.status === 'finalized';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeReport ? `Lab Report v${activeReport.version} (${activeReport.status.toUpperCase()})` : 'New Lab Report Builder'}
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            {activeReport && (
              <ExportMenu
                results={orderResults.filter((r) => selectedResultIds.includes(r.id))}
                orders={orders}
                customers={customers}
                testCatalog={testCatalog}
                samples={samples}
                label="Export Report"
              />
            )}
            {isFinalized && (
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={() => setIsForwardOpen(true)}
              >
                Forward
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" intent="neutral" onClick={onClose} disabled={loading}>
              Close
            </Button>
            {!isFinalized && (
              <Button
                type="button"
                intent="primary"
                onClick={handleSaveDraft}
                disabled={loading || !selectedOrderId}
              >
                Save Draft
              </Button>
            )}
            {activeReport && !isFinalized && (
              <Button
                type="button"
                intent="success"
                leftIcon={<Lock size={14} />}
                onClick={() => {
                  setPinAction('finalize');
                  setIsPinModalOpen(true);
                }}
                disabled={loading}
              >
                Finalize Report (PIN)
              </Button>
            )}
            {isFinalized && (
              <Button
                type="button"
                intent="warning"
                onClick={() => {
                  setPinAction('amend');
                  setIsPinModalOpen(true);
                }}
                disabled={loading}
              >
                Amend Report (Version +1)
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">
        {error && <p role="alert" className="text-sm text-danger p-2 bg-danger/10 rounded">{error}</p>}

        {/* Order Selector */}
        {!activeReport && (
          <Field>
            <FieldLabel required>Select Laboratory Order</FieldLabel>
            <select
              className="w-full bg-panel border border-border rounded-md p-2 text-sm text-text"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              <option value="">Select order and patient...</option>
              {orders.map((o) => {
                const c = customers.find((cust) => cust.id === o.customer_id);
                const t = testCatalog.find((test) => test.id === o.test_catalog_id);
                return (
                  <option key={o.id} value={o.id}>
                    Order {o.id.substring(0, 8)} — Patient: {c?.full_name || 'Unknown'} [{t?.name || 'Test'}]
                  </option>
                );
              })}
            </select>
          </Field>
        )}

        {customer && (
          <div className="p-4 bg-panel rounded-card border border-border/50 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted block">Patient</span>
              <span className="font-bold text-text text-sm">{customer.full_name}</span>
              <span className="text-text-muted block mt-1">Phone: {customer.phone || '—'}</span>
            </div>
            <div>
              <span className="text-text-muted block">Order ID</span>
              <span className="font-mono font-bold text-text text-sm">{selectedOrderId}</span>
              <span className="text-text-muted block mt-1">Status: {selectedOrder?.status}</span>
            </div>
          </div>
        )}

        {/* Results & Items Reorder */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-text">Selected Results / Analytes</h4>
          <div className="flex flex-col gap-2">
            {orderResults.map((res, index) => {
              const test = testCatalog.find((t) => t.id === selectedOrder?.test_catalog_id);
              const isSelected = selectedResultIds.includes(res.id);
              if (!isSelected && activeReport) return null;
              return (
                <div key={res.id} className="flex items-center justify-between p-3 bg-panel-strong/40 rounded-card border border-border/40 text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isFinalized}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedResultIds([...selectedResultIds, res.id]);
                        else setSelectedResultIds(selectedResultIds.filter((id) => id !== res.id));
                      }}
                    />
                    <div>
                      <p className="font-bold text-text">{test?.name || 'Test Result'}</p>
                      <p className="font-mono text-text-muted">Value: {res.value} (Ref: {res.reference_range || '—'})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {res.is_out_of_range ? <Badge variant="danger">Out of Range</Badge> : <Badge variant="success">Normal</Badge>}
                    {!isFinalized && (
                      <div className="flex items-center gap-1 ml-2">
                        <button type="button" onClick={() => moveItem(index, 'up')} className="p-1 hover:bg-surface-hover rounded"><ArrowUp size={12} /></button>
                        <button type="button" onClick={() => moveItem(index, 'down')} className="p-1 hover:bg-surface-hover rounded"><ArrowDown size={12} /></button>
                        <button type="button" onClick={() => removeItem(res.id)} className="p-1 hover:bg-danger/20 text-danger rounded"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {orderResults.length === 0 && <p className="text-xs text-text-muted italic">No results recorded for this order yet.</p>}
          </div>
        </div>

        {/* Interpretation Note */}
        <Field>
          <FieldLabel>Clinical Interpretation & Summary Note</FieldLabel>
          <textarea
            disabled={isFinalized}
            className="w-full bg-panel border border-border rounded-md p-3 text-sm text-text min-h-[90px]"
            value={summaryNote}
            onChange={(e) => setSummaryNote(e.target.value)}
            placeholder="Add pharmacist or doctor sign-off notes and recommendations..."
          />
        </Field>
      </div>

      {/* PIN Verification Modal for Finalize / Amend */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={pinAction === 'finalize' ? 'Enter PIN to Finalize Report' : 'Enter PIN to Amend Report'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" intent="neutral" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="pin-form" intent="primary">Confirm PIN</Button>
          </div>
        }
      >
        <form id="pin-form" onSubmit={handleExecutePinAction} className="flex flex-col gap-4">
          <p className="text-xs text-text-muted">This action is PIN-gated and logged for compliance auditing.</p>
          <Field>
            <FieldLabel required>6-Digit PIN</FieldLabel>
            <Input
              autoFocus
              secureTextEntry
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
            />
          </Field>
        </form>
      </Modal>

      {/* Forward Dialog */}
      <ForwardReportDialog
        isOpen={isForwardOpen}
        onClose={() => setIsForwardOpen(false)}
        users={users}
        onForward={async (toUserId, note) => {
          if (activeReport) {
            await onForwardReport(activeReport.id, toUserId, note);
          }
        }}
      />
    </Modal>
  );
};
