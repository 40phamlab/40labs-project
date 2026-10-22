import * as React from 'react';
import { Button, Field, FieldLabel, Input, Modal } from '@40labs/ui-components';
import type { LabOrder } from '@40labs/types';
import { useSampleExpiry } from '../hooks/useSampleExpiry';

type Mode = 'sample' | 'result';
interface Props {
  mode: Mode | null;
  order: LabOrder | null;
  testName: string;
  loading: boolean;
  onClose: () => void;
  onCollectSample: (orderId: string, label: string, expiresAt?: string) => Promise<unknown>;
  onEnterResult: (orderId: string, value: string, referenceRange: string, isOutOfRange: boolean, overridePin?: string, overrideReason?: string, requestRecollect?: boolean) => Promise<unknown>;
  sample?: any;
}

export const LabOrderActionModal: React.FC<Props> = ({ mode, order, testName, loading, onClose, onCollectSample, onEnterResult, sample }) => {
  const [sampleLabel, setSampleLabel] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [value, setValue] = React.useState('');
  const [referenceRange, setReferenceRange] = React.useState('');
  const [isOutOfRange, setIsOutOfRange] = React.useState(false);
  const [expiryOverridePin, setExpiryOverridePin] = React.useState('');
  const [expiryOverrideReason, setExpiryOverrideReason] = React.useState('');
  const [requestingRecollect, setRequestingRecollect] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const expiryStatus = useSampleExpiry(sample);
  const isExpired = expiryStatus === 'expired';

  React.useEffect(() => {
    setError(null);
    setSampleLabel('');
    setExpiresAt(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
    setValue('');
    setReferenceRange('');
    setIsOutOfRange(false);
    setExpiryOverridePin('');
    setExpiryOverrideReason('');
    setRequestingRecollect(false);
  }, [mode, order?.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !mode) return;
    try {
      if (mode === 'sample') {
        if (!sampleLabel.trim()) return setError('Enter a sample label.');
        await onCollectSample(order.id, sampleLabel.trim(), expiresAt ? new Date(expiresAt).toISOString() : undefined);
      } else {
        if (!value.trim()) return setError('Enter a result value.');
        if (isExpired && !requestingRecollect) {
          if (!expiryOverridePin.trim() || expiryOverridePin.trim().length !== 6) {
            return setError('Valid 6-digit PIN is required to override an expired sample.');
          }
          if (!expiryOverrideReason.trim()) {
            return setError('Mandatory reason is required to override an expired sample.');
          }
        }
        await onEnterResult(
          order.id,
          value.trim(),
          referenceRange.trim(),
          isOutOfRange,
          expiryOverridePin.trim() || undefined,
          expiryOverrideReason.trim() || undefined,
          requestingRecollect || undefined
        );
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this laboratory record.');
    }
  };

  return <Modal isOpen={!!mode && !!order} onClose={onClose} title={mode === 'sample' ? 'Collect laboratory sample' : 'Enter test result'} size="md" footer={<div className="flex justify-between items-center w-full">{isExpired && mode === 'result' ? <Button type="button" intent="danger" size="sm" onClick={() => setRequestingRecollect(!requestingRecollect)}>{requestingRecollect ? 'Cancel Recollect' : 'Request Recollect'}</Button> : <div />}<div className="flex gap-3"><Button type="button" intent="neutral" onClick={onClose} disabled={loading}>Cancel</Button><Button type="submit" form="lab-order-action-form" intent="primary" disabled={loading}>{loading ? 'Saving…' : mode === 'sample' ? 'Save sample' : 'Save result'}</Button></div></div>}>
    {order && <form id="lab-order-action-form" onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-card bg-panel p-3 text-sm"><p className="font-semibold">{testName}</p><p className="text-text-muted">Order {order.id}</p></div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {isExpired && mode === 'result' && <div className="p-3 rounded-card bg-danger/10 border border-danger/30 text-xs text-danger font-semibold">Warning: This sample has expired. Result entry is guarded. Provide an expiry override PIN and mandatory reason, or request a recollect.</div>}
      {mode === 'sample' ? <>
        <Field><FieldLabel required>Sample label</FieldLabel><Input autoFocus value={sampleLabel} onChange={(e) => setSampleLabel(e.target.value)} placeholder="e.g. BLOOD-2026-001" /></Field>
        <Field><FieldLabel>Expires at (auto-suggested / editable)</FieldLabel><Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
      </> : <>
        <Field><FieldLabel required>Result value</FieldLabel><Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Measured result" /></Field>
        <Field><FieldLabel>Reference range</FieldLabel><Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="Reference range, if applicable" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isOutOfRange} onChange={(e) => setIsOutOfRange(e.target.checked)} /> Result is outside the reference range</label>
        {isExpired && !requestingRecollect && <>
          <Field><FieldLabel required>Expiry Override PIN (6 digits)</FieldLabel><Input secureTextEntry value={expiryOverridePin} onChange={(e) => setExpiryOverridePin(e.target.value)} placeholder="Enter 6-digit PIN" maxLength={6} /></Field>
          <Field><FieldLabel required>Mandatory Reason for Override</FieldLabel><Input value={expiryOverrideReason} onChange={(e) => setExpiryOverrideReason(e.target.value)} placeholder="Explain why expired sample result is accepted" /></Field>
        </>}
      {requestingRecollect && <p className="text-xs text-accent font-semibold">Action: Sample will be marked declined and a recollect request event will be recorded.</p>}
      </>}
    </form>}
  </Modal>;
};
