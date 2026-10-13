import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Customer, AuditLogEntry } from '@40labs/types';
import { Panel, Button } from '@40labs/ui-components';
import { formatDate } from '@40labs/i18n';
import { History, ShieldCheck, UserCheck } from 'lucide-react';
import { auditApi } from '../../../../api/auditApi';

interface ActivityTabProps {
  customer: Customer;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ customer }) => {
  const { data: auditLogs = [], isLoading, isError, refetch } = useQuery<AuditLogEntry[]>({
    queryKey: ['auditLogs', customer.id],
    queryFn: async () => auditApi.list(),
  });

  const customerAuditEntries = React.useMemo(() => {
    return auditLogs
      .filter((entry) => entry.target_entity_id === customer.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [auditLogs, customer.id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Loading audit activity trail...
      </div>
    );
  }

  if (isError) {
    return (
      <Panel className="p-6 text-center space-y-3 bg-panel border border-danger/30 rounded-card">
        <p className="text-xs text-danger">Failed to load audit activity.</p>
        <Button intent="neutral" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <History size={16} className="text-accent" /> Audit Trail & System Activity
        </h3>

        <div className="space-y-3">
          {customerAuditEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between p-3 rounded-card bg-panel-strong/30 border border-border/40 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-text flex items-center gap-1.5 capitalize">
                  <ShieldCheck size={14} className="text-success" />
                  {entry.action.replace('_', ' ')}
                </span>
                <span className="text-text-muted font-mono">
                  Target: {entry.target_entity_type} ({entry.target_entity_id})
                  {entry.performed_by_user_id ? ` • Performed by ${entry.performed_by_user_id}` : ''}
                </span>
              </div>
              <span className="text-text-muted font-mono">{formatDate(entry.created_at)}</span>
            </div>
          ))}

          {/* Canonical Baseline Milestones */}
          <div className="flex items-start justify-between p-3 rounded-card bg-panel-strong/30 border border-border/40 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text flex items-center gap-1.5">
                <UserCheck size={14} className="text-accent" /> Customer Profile Created
              </span>
              <span className="text-text-muted font-mono">Initial registration record in SQLite DB</span>
            </div>
            <span className="text-text-muted font-mono">{formatDate(customer.created_at)}</span>
          </div>

          {customer.updated_at !== customer.created_at && (
            <div className="flex items-start justify-between p-3 rounded-card bg-panel-strong/30 border border-border/40 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" /> Profile Last Modified
                </span>
                <span className="text-text-muted font-mono">Contact or clinical baseline update</span>
              </div>
              <span className="text-text-muted font-mono">{formatDate(customer.updated_at)}</span>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};
