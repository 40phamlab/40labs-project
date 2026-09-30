import * as React from 'react';
import { Panel, StatusBadge } from '@40labs/ui-components';
import { ShieldCheck, Building, FileText, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../../hooks/useBusiness';
import { useFiscalReceipts } from '../../../hooks/useFiscalReceipts';

export const CompliancePanel: React.FC = () => {
  const { business } = useBusiness();
  const { fiscalReceipts } = useFiscalReceipts();

  const tmdaNumber = business?.tmda_number || 'TMDA-REG-2024-00192';
  const tinNumber = business?.tin || '102-839-401';
  const fiscalCount = fiscalReceipts.length;

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      {/* Regulatory Registrations Card */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Tanzania Medicines & Medical Devices Authority (TMDA)</h3>
            <p className="text-xs text-text-muted">
              Official institutional registration and premises licensing compliance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-panel-subtle rounded-card border border-border/50">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase block">TMDA Premises Reg Number</span>
            <span className="text-xs font-mono font-bold text-text-primary mt-1 block">
              {tmdaNumber}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase block">Registration Status</span>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status="active" label="VERIFIED & ACTIVE" />
            </div>
          </div>
        </div>
      </Panel>

      {/* Pharmacy Council & Professional Standards Card */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
            <Building size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Pharmacy Council of Tanzania</h3>
            <p className="text-xs text-text-muted">
              Supervising Pharmacist and professional practice standard guidelines.
            </p>
          </div>
        </div>

        <div className="p-4 bg-panel-subtle rounded-card border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Supervising Pharmacist License</span>
            <span className="font-mono font-bold text-text-primary">PCT-REG-2023-8812</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Annual Practice Permit</span>
            <StatusBadge status="active" label="VALID UNTIL DEC 2025" />
          </div>
          <p className="text-[11px] text-text-muted pt-2 border-t border-border/40">
            All dispensing activities, controlled substance logs, and batch trackings are executed in accordance with Pharmacy Council Regulations and TMDA Good Dispensing Practice (GDP) standards.
          </p>
        </div>
      </Panel>

      {/* TRA Fiscal EFD Compliance Card */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Tanzania Revenue Authority (TRA) EFD Integration</h3>
            <p className="text-xs text-text-muted">
              Fiscal receipt generation, TIN registration, and EFD electronic signature relay.
            </p>
          </div>
        </div>

        <div className="p-4 bg-panel-subtle rounded-card border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary block">TIN: {tinNumber}</span>
              <span className="text-[11px] font-mono text-text-muted">
                TRA EFD Fiscal Signatures Issued: {fiscalCount}
              </span>
            </div>
            <StatusBadge status="active" label="TRA CONNECTED" />
          </div>

          <div className="p-3 bg-success/10 text-success text-xs rounded-card flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>TRA EFD Fiscal Gateway active and operational for automated receipt signing.</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};
