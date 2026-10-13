import * as React from 'react';
import { Button, Select } from '@40labs/ui-components';
import type { LabQcData } from '@40labs/types';
import type { CreateLabQcEquipmentPayload, CreateLabQcRecordPayload } from '../../../api/labApi';

interface Props {
  data: LabQcData;
  loading: boolean;
  onAddEquipment: (payload: CreateLabQcEquipmentPayload) => Promise<unknown>;
  onRecord: (payload: CreateLabQcRecordPayload) => Promise<unknown>;
  error?: string | null;
  onRetry: () => void;
}

export const LabQcPanel: React.FC<Props> = ({ data, loading, onAddEquipment, onRecord, error: loadError, onRetry }) => {
  const [equipmentForm, setEquipmentForm] = React.useState({ name: '', manufacturer: '', model: '', assetTag: '' });
  const [recordForm, setRecordForm] = React.useState({ equipmentId: '', controlName: '', lotNumber: '', observedValue: '', expectedRange: '', outcome: 'pass' as 'pass' | 'fail' });
  const [error, setError] = React.useState<string | null>(null);

  const addEquipment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!equipmentForm.name.trim()) return setError('Equipment name is required.');
    setError(null);
    try {
      await onAddEquipment({ ...equipmentForm, name: equipmentForm.name.trim() });
      setEquipmentForm({ name: '', manufacturer: '', model: '', assetTag: '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save equipment.');
    }
  };
  const recordQc = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recordForm.equipmentId || !recordForm.controlName.trim() || !recordForm.observedValue.trim() || !recordForm.expectedRange.trim()) return setError('Choose equipment and complete the control, observed value, and expected range.');
    setError(null);
    try {
      await onRecord(recordForm);
      setRecordForm((current) => ({ ...current, controlName: '', lotNumber: '', observedValue: '', expectedRange: '' }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this QC run.');
    }
  };

  return <section className="flex flex-col gap-5 w-full">
    {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><span>{loadError}</span><Button type="button" intent="neutral" onClick={onRetry}>Retry</Button></div>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <form onSubmit={addEquipment} className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
        <h2 className="font-bold text-text">Equipment register</h2>
        <p className="text-xs text-text-muted">Register analyzers and instruments used for laboratory work.</p>
        <input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Equipment name *" value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2"><input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Manufacturer" value={equipmentForm.manufacturer} onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })} /><input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Model" value={equipmentForm.model} onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })} /></div>
        <input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Asset tag (optional)" value={equipmentForm.assetTag} onChange={(e) => setEquipmentForm({ ...equipmentForm, assetTag: e.target.value })} />
        <Button type="submit" intent="primary" disabled={loading}>{loading ? 'Saving…' : 'Add equipment'}</Button>
      </form>
      <form onSubmit={recordQc} className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-3">
        <h2 className="font-bold text-text">Record a QC run</h2>
        <p className="text-xs text-text-muted">Store the measured control result and compare it with its expected range.</p>
        <Select value={recordForm.equipmentId} onChange={(e) => setRecordForm({ ...recordForm, equipmentId: e.target.value })}><option value="">Choose equipment *</option>{data.equipment.map((item) => <option key={item.id} value={item.id}>{item.name}{item.asset_tag ? ` · ${item.asset_tag}` : ''}</option>)}</Select>
        <input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Control name *" value={recordForm.controlName} onChange={(e) => setRecordForm({ ...recordForm, controlName: e.target.value })} />
        <div className="grid grid-cols-2 gap-2"><input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Observed value *" value={recordForm.observedValue} onChange={(e) => setRecordForm({ ...recordForm, observedValue: e.target.value })} /><input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Expected range *" value={recordForm.expectedRange} onChange={(e) => setRecordForm({ ...recordForm, expectedRange: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2"><input className="rounded-input border border-border bg-panel px-3 py-2 text-sm" placeholder="Lot number" value={recordForm.lotNumber} onChange={(e) => setRecordForm({ ...recordForm, lotNumber: e.target.value })} /><Select value={recordForm.outcome} onChange={(e) => setRecordForm({ ...recordForm, outcome: e.target.value as 'pass' | 'fail' })}><option value="pass">Pass</option><option value="fail">Fail</option></Select></div>
        <Button type="submit" intent="primary" disabled={loading || data.equipment.length === 0}>{loading ? 'Saving…' : 'Save QC run'}</Button>
      </form>
    </div>
    <div className="rounded-card border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50"><h2 className="font-bold text-text">Registered equipment</h2></div>
      {data.equipment.length === 0 ? <p className="p-5 text-sm text-text-muted">No laboratory equipment is registered for this branch.</p> : <div className="divide-y divide-border/50">{data.equipment.map((item) => <div key={item.id} className="grid grid-cols-2 lg:grid-cols-5 gap-2 p-4 text-sm items-center"><span className="font-semibold">{item.name}</span><span>{item.manufacturer || 'Manufacturer not set'}</span><span>{item.model || 'Model not set'}</span><span>{item.asset_tag || 'No asset tag'}</span><span className="capitalize">{item.status.replace(/_/g, ' ')}</span></div>)}</div>}
    </div>
    <div className="rounded-card border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50"><h2 className="font-bold text-text">Quality control history</h2></div>
      {data.records.length === 0 ? <p className="p-5 text-sm text-text-muted">No QC runs have been recorded.</p> : <div className="divide-y divide-border/50">{data.records.map((record) => {
        const equipment = data.equipment.find((item) => item.id === record.equipment_id);
        return <div key={record.id} className="grid grid-cols-2 lg:grid-cols-6 gap-2 p-4 text-sm items-center"><span className="font-semibold">{record.control_name}</span><span>{equipment?.name || 'Equipment'}</span><span>{record.observed_value}</span><span>Expected: {record.expected_range}</span><span>{new Date(record.performed_at).toLocaleString()}</span><span className={record.outcome === 'pass' ? 'text-success font-bold' : 'text-danger font-bold'}>{record.outcome.toUpperCase()}</span></div>;
      })}</div>}
    </div>
  </section>;
};
