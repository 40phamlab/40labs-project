// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { History, ShieldCheck } from 'lucide-react';

interface ActivityTabProps {
  customer: Customer;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ customer }) => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <History size={16} className="text-accent" /> Audit Trail & Version History
        </h3>
        <div className="space-y-3">
          <div className="flex items-start justify-between p-3 rounded-card bg-panel-strong/30 border border-border/40 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-success" /> Profile Created
              </span>
              <span className="text-text-muted font-mono">Initial registration on workspace</span>
            </div>
            <span className="text-text-muted font-mono">{formatDate(customer.created_at)}</span>
          </div>

          <div className="flex items-start justify-between p-3 rounded-card bg-panel-strong/30 border border-border/40 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-success" /> Last Profile Update
              </span>
              <span className="text-text-muted font-mono">Structured medical profile or contact update</span>
            </div>
            <span className="text-text-muted font-mono">{formatDate(customer.updated_at)}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};
