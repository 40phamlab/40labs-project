// [PHASE: MVP]
import * as React from 'react';
import type { Customer, AllergyItem } from '@40labs/types';
import { Panel } from '@40labs/ui-components';

interface MedicalProfileTabProps {
  customer: Customer;
}

export const MedicalProfileTab: React.FC<MedicalProfileTabProps> = ({ customer }) => {
  let allergies: AllergyItem[] = [];
  try {
    allergies = typeof customer.allergies === 'string' ? JSON.parse(customer.allergies) : customer.allergies || [];
  } catch {
    allergies = [];
  }

  let chronic: string[] = [];
  try {
    chronic = typeof customer.chronic_conditions === 'string' ? JSON.parse(customer.chronic_conditions) : customer.chronic_conditions || [];
  } catch {
    chronic = [];
  }

  let meds: string[] = [];
  try {
    meds = typeof customer.current_medications === 'string' ? JSON.parse(customer.current_medications) : customer.current_medications || [];
  } catch {
    meds = [];
  }

  let ec: any = customer.emergency_contact;
  try {
    if (typeof ec === 'string') ec = JSON.parse(ec);
  } catch {
    ec = null;
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Vitals & Demographics */}
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Clinical Baseline</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-panel-strong/30 rounded-card">
            <span className="text-text-muted uppercase text-[10px] font-bold">DOB / Age</span>
            <p className="font-mono text-sm font-bold text-text mt-1">{customer.dob || '—'}</p>
          </div>
          <div className="p-3 bg-panel-strong/30 rounded-card">
            <span className="text-text-muted uppercase text-[10px] font-bold">Sex</span>
            <p className="text-sm font-bold text-text mt-1 capitalize">{customer.sex || '—'}</p>
          </div>
          <div className="p-3 bg-panel-strong/30 rounded-card">
            <span className="text-text-muted uppercase text-[10px] font-bold">Blood Group</span>
            <p className="font-mono text-sm font-bold text-text mt-1">{customer.blood_group || '—'}</p>
          </div>
        </div>
      </Panel>

      {/* Allergies */}
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Allergies & Adverse Reactions</h3>
        {allergies.length > 0 ? (
          <div className="space-y-2">
            {allergies.map((alg, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-card bg-panel-strong/30 border border-border/50 text-xs">
                <span className="font-bold text-text">{alg.substance}</span>
                <span className="text-text-muted">Reaction: {alg.reaction || 'None specified'}</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${alg.severity === 'severe' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-warning/20 text-warning'}`}>
                  {alg.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic">No allergies recorded.</p>
        )}
      </Panel>

      {/* Chronic Conditions & Medications */}
      <div className="grid grid-cols-2 gap-6">
        <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Chronic Conditions</h3>
          {chronic.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chronic.map((c, idx) => (
                <span key={idx} className="px-3 py-1 rounded bg-panel-strong/40 border border-border/50 text-xs font-semibold text-text">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No chronic conditions recorded.</p>
          )}
        </Panel>

        <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Current Medications</h3>
          {meds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meds.map((m, idx) => (
                <span key={idx} className="px-3 py-1 rounded bg-panel-strong/40 border border-border/50 text-xs font-semibold text-text">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No current medications recorded.</p>
          )}
        </Panel>
      </div>

      {/* Emergency Contact & Notes */}
      <div className="grid grid-cols-2 gap-6">
        <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Emergency Contact & Location</h3>
          <div className="space-y-2 text-xs text-text">
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-text-muted">Contact Name:</span>
              <span className="font-semibold">{ec?.name || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-text-muted">Contact Phone:</span>
              <span className="font-mono">{ec?.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Ward / District:</span>
              <span>{customer.ward_district || '—'}</span>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Pharmacy Notes (Non-clinical)</h3>
          <p className="text-xs text-text leading-relaxed italic bg-panel-strong/20 p-4 rounded-card border border-border/30">
            {customer.pharmacy_notes || customer.notes || 'No pharmacy notes recorded.'}
          </p>
        </Panel>
      </div>
    </div>
  );
};
