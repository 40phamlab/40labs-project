import * as React from 'react';
import { Button, Field, FieldLabel, Input, Modal } from '@40labs/ui-components';
import type { LabOrder } from '@40labs/types';

type Mode = 'sample' | 'result';
interface Props {
  mode: Mode | null;
  order: LabOrder | null;
  testName: string;
  loading: boolean;
  onClose: () => void;
  onCollectSample: (orderId: string, label: string) => Promise<unknown>;
  onEnterResult: (orderId: string, value: string, referenceRange: string, isOutOfRange: boolean) => Promise<unknown>;
}

export const LabOrderActionModal: React.FC<Props> = ({ mode, order, testName, loading, onClose, onCollectSample, onEnterResult }) => {
  const [sampleLabel, setSampleLabel] = React.useState('');
  const [value, setValue] = React.useState('');
  const [referenceRange, setReferenceRange] = React.useState('');
  const [isOutOfRange, setIsOutOfRange] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { setError(null); setSampleLabel(''); setValue(''); setReferenceRange(''); setIsOutOfRange(false); }, [mode, order?.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !mode) return;
    try {
      if (mode === 'sample') {
        if (!sampleLabel.trim()) return setError('Enter a sample label.');
        await onCollectSample(order.id, sampleLabel.trim());
      } else {
        if (!value.trim()) return setError('Enter a result value.');
        await onEnterResult(order.id, value.trim(), referenceRange.trim(), isOutOfRange);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this laboratory record.');
    }
  };

  return <Modal isOpen={!!mode && !!order} onClose={onClose} title={mode === 'sample' ? 'Collect laboratory sample' : 'Enter test result'} size="md" footer={<div className="flex justify-end gap-3 w-full"><Button type="button" intent="neutral" onClick={onClose} disabled={loading}>Cancel</Button><Button type="submit" form="lab-order-action-form" intent="primary" disabled={loading}>{loading ? 'Saving…' : mode === 'sample' ? 'Save sample' : 'Save result'}</Button></div>}>
    {order && <form id="lab-order-action-form" onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-card bg-panel p-3 text-sm"><p className="font-semibold">{testName}</p><p className="text-text-muted">Order {order.id}</p></div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {mode === 'sample' ? <Field><FieldLabel required>Sample label</FieldLabel><Input autoFocus value={sampleLabel} onChange={(e) => setSampleLabel(e.target.value)} placeholder="e.g. BLOOD-2026-001" /></Field> : <>
        <Field><FieldLabel required>Result value</FieldLabel><Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Measured result" /></Field>
        <Field><FieldLabel>Reference range</FieldLabel><Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="Reference range, if applicable" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isOutOfRange} onChange={(e) => setIsOutOfRange(e.target.checked)} /> Result is outside the reference range</label>
      </>}
    </form>}
  </Modal>;
};
