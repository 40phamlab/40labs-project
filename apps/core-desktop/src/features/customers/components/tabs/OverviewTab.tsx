// [PHASE: MVP]
import * as React from 'react';
import type { Customer, AllergyItem } from '@40labs/types';
import { Panel } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { AlertTriangle, Clock, FlaskConical, DollarSign } from 'lucide-react';

interface OverviewTabProps {
  customer: Customer;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ customer }) => {
  let allergies: AllergyItem[] = [];
  try {
    allergies = typeof customer.allergies === 'string' ? JSON.parse(customer.allergies) : customer.allergies || [];
  } catch {
    allergies = [];
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Allergy Banner */}
      {allergies.length > 0 && (
        <div className="p-4 rounded-card bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-3">
          <AlertTriangle size={20} className="text-[#EF4444] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Allergy Alert</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {allergies.map((alg, idx) => (
                <span key={idx} className="text-xs px-2 py-0.5 rounded bg-panel border border-[#EF4444]/40 text-text">
                  <strong>{alg.substance}</strong> ({alg.reaction} — {alg.severity})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Facts Grid */}
      <div className="grid grid-cols-3 gap-6">
        <Panel className="p-5 flex flex-col gap-2 bg-panel rounded-card border border-border">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={14} className="text-accent" /> Last Visit
          </span>
          <span className="text-sm font-mono text-text font-semibold">
            {formatDate(customer.updated_at)}
          </span>
        </Panel>

        <Panel className="p-5 flex flex-col gap-2 bg-panel rounded-card border border-border">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <FlaskConical size={14} className="text-accent" /> Open Lab Orders
          </span>
          <span className="text-sm font-mono text-text font-semibold">
            0 active orders
          </span>
        </Panel>

        <Panel className="p-5 flex flex-col gap-2 bg-panel rounded-card border border-border">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign size={14} className="text-accent" /> Outstanding Balance
          </span>
          <span className="text-sm font-mono font-bold text-text">
            {customer.outstanding_balance} TZS
          </span>
        </Panel>
      </div>

      {/* Additional Quick Details */}
      <div className="grid grid-cols-2 gap-6">
        <Panel className="p-5 space-y-3 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Demographics & Contact</h3>
          <div className="space-y-2 text-xs text-text">
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-text-muted">DOB / Age:</span>
              <span className="font-mono">{customer.dob || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-text-muted">Sex:</span>
              <span className="capitalize">{customer.sex || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-text-muted">Blood Group:</span>
              <span className="font-mono">{customer.blood_group || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Ward / District:</span>
              <span>{customer.ward_district || '—'}</span>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 space-y-3 bg-panel rounded-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Emergency Contact</h3>
          {customer.emergency_contact ? (() => {
            let ec: any = customer.emergency_contact;
            try {
              if (typeof ec === 'string') ec = JSON.parse(ec);
            } catch {
              ec = null;
            }
            return ec ? (
              <div className="space-y-2 text-xs text-text">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Name:</span>
                  <span className="font-semibold">{ec.name || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Phone:</span>
                  <span className="font-mono">{ec.phone || '—'}</span>
                </div>
              </div>
            ) : <p className="text-xs text-text-muted italic">No emergency contact registered.</p>;
          })() : <p className="text-xs text-text-muted italic">No emergency contact registered.</p>}
        </Panel>
      </div>
    </div>
  );
};
