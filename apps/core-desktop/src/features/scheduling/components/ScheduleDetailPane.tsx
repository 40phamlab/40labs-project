import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { StatusBadge, Button, Dropdown, DropdownMenuItem, Switch } from '@40labs/ui-components';
import { FileText, Send, RotateCcw, Edit3, MoreVertical, Calendar, ArrowLeft, BarChart2 } from 'lucide-react';
import { formatDateTime } from '@40labs/i18n';
import { CollapsibleSection } from './CollapsibleSection';

interface ScheduleDetailPaneProps {
  readonly schedule?: Schedule | null;
  readonly onEdit: () => void;
  readonly onDelete: (id: string) => void;
  readonly onToggleEnabled: (id: string, enabled: boolean) => void;
  readonly onSendNow?: (id: string) => void;
  readonly onRetryFailed?: (id: string) => void;
  readonly onBack?: () => void;
  readonly isMobileView?: boolean;
}

const CHANNEL_LABELS: Record<string, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  in_app: 'In-App',
  google_drive: 'Google Drive',
  gmail: 'Gmail',
};

export const ScheduleDetailPane: React.FC<ScheduleDetailPaneProps> = ({
  schedule,
  onEdit,
  onDelete,
  onToggleEnabled,
  onSendNow,
  onRetryFailed,
  onBack,
  isMobileView,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [typedCampaignName, setTypedCampaignName] = React.useState('');

  if (!schedule) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-panel text-center">
        <div className="p-8 max-w-sm mx-auto flex flex-col items-center gap-3 bg-panel-strong/30 border border-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
            <Calendar size={24} />
          </div>
          <h3 className="text-sm font-bold text-text">No Schedule Selected</h3>
          <p className="text-xs text-text-muted">
            Select a schedule from the list to view its details, message preview, and routing configuration.
          </p>
        </div>
      </div>
    );
  }

  const isEnabled = schedule.enabled !== false;
  const statusType =
    schedule.status === 'sent'
      ? 'success'
      : schedule.status === 'failed'
      ? 'error'
      : 'pending';

  const recipientSummaryText = React.useMemo(() => {
    if (schedule.recipient_scope === 'all') return 'All contacts in system';
    if (schedule.recipient_ids && schedule.recipient_ids.length > 0) {
      return `${schedule.recipient_ids.length} specific recipients selected`;
    }
    return `Scope: ${schedule.recipient_scope}`;
  }, [schedule.recipient_scope, schedule.recipient_ids]);

  const hasFailures = schedule.failure_count > 0;
  const isSent = schedule.status === 'sent';
  const isQueued = schedule.status === 'queued_offline';

  const handleToggle = (newChecked: boolean) => {
    // Compliance audit log entry before mutation
    console.log(`[AuditLog] Schedule enabled state changed to ${newChecked} for schedule ${schedule.id}`);
    onToggleEnabled(schedule.id, newChecked);
  };

  const handleDeleteConfirmed = () => {
    if (isSent && typedCampaignName.trim() !== schedule.title.trim()) {
      alert('Campaign name does not match exact title.');
      return;
    }
    onDelete(schedule.id);
    setShowDeleteConfirm(false);
    setTypedCampaignName('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-panel overflow-hidden relative">
      {/* Scrollable Content Region */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
        {/* Mobile Back Button */}
        {isMobileView && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-accent font-semibold cursor-pointer mb-2"
          >
            <ArrowLeft size={16} /> Back to list
          </button>
        )}

        {/* Header: Category, Status Badge, Active Switch, ID, Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-panel-strong border border-border/60 uppercase">
                {schedule.category}
              </span>
              <StatusBadge status={statusType as any} label={schedule.status} />
              {!isEnabled && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border/60 text-text-muted">
                  Paused
                </span>
              )}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border/40">
                <Switch
                  checked={isEnabled}
                  onChange={handleToggle}
                />
                <span className="text-xs font-bold text-text">Active</span>
              </div>
            </div>
            <span className="text-xs font-mono text-text-muted">ID: {schedule.id}</span>
          </div>

          <h1 className="font-heading text-xl font-bold text-text leading-tight">{schedule.title}</h1>
        </div>

        {/* 1. Summary: single inline row, default collapsed */}
        <CollapsibleSection title="Summary" defaultOpen={false}>
          <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-panel-strong/30 border border-border/40">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Type</span>
              <span className="font-mono text-xs font-bold text-text capitalize mt-0.5">{schedule.schedule_type}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Sent</span>
              <span className="font-mono text-xs font-bold text-text mt-0.5">{schedule.sent_count}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Pending</span>
              <span className="font-mono text-xs font-bold text-text mt-0.5">{schedule.pending_count}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Failures</span>
              <span className="font-mono text-xs font-bold text-danger mt-0.5">{schedule.failure_count}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Delivery: Channels & Recipients, default open */}
        <CollapsibleSection title="Delivery" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-panel-strong/30 border border-border/40 rounded-xl space-y-2">
              <span className="text-[10px] text-text-muted uppercase font-bold">Channels</span>
              <div className="flex flex-wrap gap-1.5">
                {schedule.channels.map((ch) => (
                  <span key={ch} className="px-2.5 py-1 rounded bg-panel border border-border/60 font-mono text-xs font-bold text-text">
                    {CHANNEL_LABELS[ch] || ch}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-panel-strong/30 border border-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-bold">Recipients</span>
              <p className="text-xs font-bold text-text uppercase">{schedule.recipient_scope}</p>
              <p className="text-[11px] text-text-muted">{recipientSummaryText}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* 3. Message: Preview, default open */}
        <CollapsibleSection title="Message" defaultOpen={true}>
          <div className="overflow-y-auto max-h-[220px] p-4 rounded-xl bg-panel-strong/30 border border-border/40 font-mono text-xs text-text whitespace-pre-wrap leading-relaxed custom-scrollbar">
            {schedule.message_body || 'No message body configured.'}
          </div>
        </CollapsibleSection>

        {/* 4. Attachments: Default open if any exist, hidden if none */}
        {schedule.attachments && schedule.attachments.length > 0 && (
          <CollapsibleSection title="Attachments" defaultOpen={true}>
            <div className="space-y-2">
              {schedule.attachments.map((att: any, idx: number) => {
                const isReport = typeof att === 'object' && att.kind === 'report';
                const name = isReport ? `Report: ${att.report}` : (typeof att === 'string' ? att : att.name);
                const subtitle = isReport ? `Period: ${JSON.stringify(att.period)}` : (att.size || 'PDF / File');

                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-panel-strong/30 border border-border/40 text-xs">
                    <div className="flex items-center gap-2 font-mono text-text">
                      {isReport ? <BarChart2 size={14} className="text-accent" /> : <FileText size={14} className="text-accent" />}
                      <span className="font-bold">{name}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-muted">{subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* 5. History: sent/failed log per attempt, default collapsed */}
        <CollapsibleSection title="History" defaultOpen={false}>
          <div className="p-4 rounded-xl bg-panel-strong/30 border border-border/40 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-text-muted pb-1 border-b border-border/30 text-[10px]">
              <span>TIMESTAMP</span>
              <span>CHANNEL</span>
              <span>STATUS</span>
            </div>
            <div className="flex justify-between text-text items-center py-1">
              <span>{formatDateTime(schedule.scheduled_at)}</span>
              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-panel">SMS</span>
              <span className="text-success font-bold text-[10px]">SUCCESS</span>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Sticky Action Bar (sticky below scroll region, never overlaying message preview) */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-panel border-t border-border/50 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-2">
          {hasFailures ? (
            <Button
              intent="primary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => onRetryFailed?.(schedule.id)}
            >
              Retry Failed ({schedule.failure_count})
            </Button>
          ) : (
            <span title={isSent ? 'Cannot send now: schedule already sent.' : isQueued ? 'Schedule is queued.' : undefined}>
              <Button
                intent="primary"
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={() => onSendNow?.(schedule.id)}
                disabled={isSent || isQueued}
              >
                Send Now
              </Button>
            </span>
          )}

          <Button
            intent="neutral"
            size="sm"
            leftIcon={<Edit3 size={14} />}
            onClick={onEdit}
          >
            Edit
          </Button>
        </div>

        {/* More Menu (Pause/Resume + Delete) */}
        <div className="relative">
          <Dropdown
            isOpen={isMoreMenuOpen}
            onClose={() => setIsMoreMenuOpen(false)}
            trigger={
              <Button
                intent="neutral"
                size="sm"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                leftIcon={<MoreVertical size={16} />}
              >
                More
              </Button>
            }
          >
            <DropdownMenuItem
              label={isEnabled ? 'Pause Schedule' : 'Resume Schedule'}
              onClick={() => {
                setIsMoreMenuOpen(false);
                handleToggle(!isEnabled);
              }}
            />
            <DropdownMenuItem
              label="Delete Schedule"
              onClick={() => {
                setIsMoreMenuOpen(false);
                setShowDeleteConfirm(true);
              }}
            />
          </Dropdown>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <div className="bg-panel border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-text">Confirm Schedule Deletion</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete <strong className="text-text">{schedule.title}</strong>?
              {isSent && (
                <span className="block mt-2 text-danger">
                  This campaign has been sent. Please type the campaign title exact name below to confirm:
                </span>
              )}
            </p>
            {isSent && (
              <input
                type="text"
                placeholder={schedule.title}
                value={typedCampaignName}
                onChange={(e) => setTypedCampaignName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded bg-panel-strong border border-border text-text focus:outline-none focus:border-danger font-mono"
              />
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button intent="neutral" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                intent="danger"
                size="sm"
                onClick={handleDeleteConfirmed}
                disabled={isSent && typedCampaignName.trim() !== schedule.title.trim()}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
