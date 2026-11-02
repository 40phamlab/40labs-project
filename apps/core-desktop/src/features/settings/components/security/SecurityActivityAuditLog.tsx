import * as React from 'react';
import { Panel, DataTable, StatusBadge, type ColumnDefinition } from '@40labs/ui-components';
import { History } from 'lucide-react';

interface AuditEvent {
  id: string;
  event: string;
  user: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'warning' | 'failed';
}

interface SecurityActivityAuditLogProps {
  events: AuditEvent[];
}

export const SecurityActivityAuditLog: React.FC<SecurityActivityAuditLogProps> = ({ events }) => {
  const columns: ColumnDefinition<AuditEvent>[] = [
    {
      key: 'event',
      header: 'Security Event',
      render: (ev) => (
        <div className="text-xs font-bold text-text-primary flex items-center gap-2">
          <History size={14} className="text-primary" />
          {ev.event}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Actor',
      render: (ev) => <span className="text-xs text-text-secondary">{ev.user}</span>,
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (ev) => <span className="text-xs font-mono text-text-muted">{ev.ip}</span>,
    },
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (ev) => (
        <span className="text-xs font-mono text-text-secondary">
          {new Date(ev.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ev) => (
        <StatusBadge
          status={ev.status === 'success' ? 'success' : ev.status === 'warning' ? 'warning' : 'error'}
          label={ev.status.toUpperCase()}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text-primary tracking-tight">Security Activity Audit Log</h2>
        <p className="text-xs text-text-muted">Recent security-related events and login attempts across your account.</p>
      </div>

      <Panel variant="raised" className="overflow-hidden">
        <DataTable
          data={events}
          columns={columns}
          loading={false}
          emptyMessage="No security audit events recorded."
          keyExtractor={(ev) => ev.id}
          density="compact"
        />
      </Panel>
    </div>
  );
};
