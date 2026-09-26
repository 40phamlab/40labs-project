import * as React from 'react';
import { Schedule } from '@40labs/types';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Panel,
  StatusBadge,
  Button,
} from '@40labs/ui-components';
import { Clock, FileText, Trash2, Edit3, Send, Calendar, Square } from 'lucide-react';

interface ScheduleDetailPanelProps {
  schedule?: Schedule | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onStop: (id: string) => void;
  onSendNow?: (id: string) => void;
}

export const ScheduleDetailPanel: React.FC<ScheduleDetailPanelProps> = ({
  schedule,
  onEdit,
  onDelete,
  onStop,
  onSendNow,
}) => {
  if (!schedule) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-panel border border-border/50 rounded-card p-8 text-center">
          <Panel variant="flat" className="p-6 max-w-sm mx-auto flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
              <Calendar size={24} />
            </div>
            <h3 className="text-sm font-bold text-text">No Schedule Selected</h3>
            <p className="text-xs text-text-muted">
              Select a schedule from the list to view its details, message preview, and routing configuration.
            </p>
          </Panel>
        </Card>
      </div>
    );
  }

  const statusType = React.useMemo(() => {
    switch (schedule.status) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'error';
      case 'cancelled':
      default:
        return 'cancelled';
    }
  }, [schedule.status]);

  const recipientSummaryText = React.useMemo(() => {
    if (schedule.recipient_scope === 'all') return 'All contacts in system';
    if (schedule.recipient_ids && schedule.recipient_ids.length > 0) {
      return `${schedule.recipient_ids.length} specific ${schedule.recipient_scope} selected`;
    }
    return `Scope: ${schedule.recipient_scope}`;
  }, [schedule.recipient_scope, schedule.recipient_ids]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <Card className="w-full max-w-2xl max-h-full flex flex-col bg-panel border border-border/50 rounded-card overflow-hidden">
        {/* Header Section */}
        <CardHeader className="bg-panel-strong/40 flex flex-col gap-3 p-4 border-b border-border/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel border border-border uppercase">
                {schedule.category}
              </span>
              <StatusBadge status={statusType as any} label={schedule.status} />
            </div>
            <span className="text-xs font-mono text-text-muted">ID: {schedule.id}</span>
          </div>

          <h1 className="font-heading text-lg font-bold text-text">{schedule.title}</h1>

          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-card bg-surface border border-border flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Type</span>
              <span className="font-mono text-xs font-bold text-text mt-0.5">{schedule.schedule_type}</span>
            </div>
            <div className="p-2.5 rounded-card bg-surface border border-border flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Sent</span>
              <span className="font-mono text-xs font-bold text-[var(--color-primary)] mt-0.5">{schedule.sent_count}</span>
            </div>
            <div className="p-2.5 rounded-card bg-surface border border-border flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Pending</span>
              <span className="font-mono text-xs font-bold text-text mt-0.5">{schedule.pending_count}</span>
            </div>
            <div className="p-2.5 rounded-card bg-surface border border-border flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Failures</span>
              <span className="font-mono text-xs font-bold text-[var(--color-danger)] mt-0.5">{schedule.failure_count}</span>
            </div>
          </div>
        </CardHeader>

        {/* Body Section */}
        <CardBody className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {/* Channels & Recipients */}
          <div className="grid grid-cols-2 gap-3">
            <Panel className="p-3 bg-surface border border-border rounded-card flex flex-col gap-1.5">
              <span className="text-[10px] text-text-muted uppercase font-bold">Delivery Channels</span>
              <div className="flex flex-wrap gap-1">
                {schedule.channels.map((ch) => (
                  <span key={ch} className="px-2 py-0.5 rounded bg-panel border border-border font-mono text-xs font-bold text-text">
                    {ch}
                  </span>
                ))}
              </div>
            </Panel>
            <Panel className="p-3 bg-surface border border-border rounded-card flex flex-col gap-1.5">
              <span className="text-[10px] text-text-muted uppercase font-bold">Recipients</span>
              <span className="text-xs font-bold text-text uppercase">{schedule.recipient_scope}</span>
              <span className="text-[11px] text-text-muted">{recipientSummaryText}</span>
            </Panel>
          </div>

          {/* Full Message Body Preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Message Preview / Body</span>
            <div className="p-4 rounded-card bg-surface border border-border font-mono text-xs text-text whitespace-pre-wrap leading-relaxed">
              {schedule.message_body || 'No message body configured.'}
            </div>
          </div>

          {/* Attachments */}
          {schedule.attachments && schedule.attachments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Attachments</span>
              <div className="flex flex-wrap gap-2">
                {schedule.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-card bg-surface border border-border">
                    <FileText size={14} className="text-[var(--color-primary)]" />
                    <span className="font-mono text-xs text-text">{att}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timing & Repeat */}
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-strong border border-border text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-primary)]" />
              <span>Scheduled: <strong className="font-mono text-text">{new Date(schedule.scheduled_at).toLocaleString()}</strong></span>
            </div>
            <div>
              <span>Repeat: <strong className="font-mono text-text uppercase">{schedule.repeat_interval}</strong></span>
            </div>
          </div>
        </CardBody>

        {/* Footer Actions (mirroring NotificationDetailPanel layout) */}
        <CardFooter className="bg-panel-strong/40 p-4 border-t border-border/30 flex items-center justify-between shrink-0">
          <Button
            type="button"
            intent="danger"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => onDelete(schedule.id)}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            {schedule.status === 'pending' && (
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<Square size={14} />}
                onClick={() => onStop(schedule.id)}
                className="text-[var(--color-danger)]"
              >
                Stop Schedule
              </Button>
            )}
            {onSendNow && (
              <Button
                type="button"
                intent="primary"
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={() => onSendNow(schedule.id)}
              >
                Send Now
              </Button>
            )}
            <Button
              type="button"
              intent="neutral"
              size="sm"
              leftIcon={<Edit3 size={14} />}
              onClick={onEdit}
            >
              Edit
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
