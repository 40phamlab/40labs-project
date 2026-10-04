// [PHASE: MVP]
import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { StatusBadge, Button, Dropdown, DropdownMenuItem } from '@40labs/ui-components';
import { Clock, FileText, Send, RotateCcw, Edit3, MoreVertical, Calendar, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@40labs/i18n';

interface ScheduleDetailPanelProps {
  schedule?: Schedule | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onSendNow?: (id: string) => void;
  onRetryFailed?: (id: string) => void;
  onBack?: () => void;
  isMobileView?: boolean;
}

export const ScheduleDetailPanel: React.FC<ScheduleDetailPanelProps> = ({
  schedule,
  onEdit,
  onDelete,
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

  const statusType = React.useMemo(() => {
    switch (schedule.status) {
      case 'sent': return 'success';
      case 'pending': return 'pending';
      case 'failed': return 'error';
      case 'cancelled': default: return 'cancelled';
    }
  }, [schedule.status]);

  const recipientSummaryText = React.useMemo(() => {
    if (schedule.recipient_scope === 'all') return 'All contacts in system';
    if (schedule.recipient_ids && schedule.recipient_ids.length > 0) {
      return `${schedule.recipient_ids.length} specific ${schedule.recipient_scope} selected`;
    }
    return `Scope: ${schedule.recipient_scope}`;
  }, [schedule.recipient_scope, schedule.recipient_ids]);

  const hasFailures = schedule.failure_count > 0;
  const isSent = schedule.status === 'sent';

  const handleDeleteConfirmed = () => {
    if (isSent && typedCampaignName.trim() !== schedule.title.trim()) {
      alert('Campaign name does not match. Type exact title to confirm deletion.');
      return;
    }
    onDelete(schedule.id);
    setShowDeleteConfirm(false);
    setTypedCampaignName('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-panel overflow-hidden relative">
      {/* Scrollable Content with pb-24 for sticky footer */}
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

        {/* Section 1: Summary / Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-panel-strong border border-border/60 uppercase">
                {schedule.category}
              </span>
              <StatusBadge status={statusType as any} label={schedule.status} />
            </div>
            <span className="text-xs font-mono text-text-muted">ID: {schedule.id}</span>
          </div>

          <h1 className="font-heading text-xl font-bold text-text leading-tight">{schedule.title}</h1>

          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-panel-strong/30 border border-border/60 flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Type</span>
              <span className="font-mono text-xs font-bold text-text mt-1 capitalize">{schedule.schedule_type}</span>
            </div>
            <div className="p-3 rounded-xl bg-panel-strong/30 border border-border/60 flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Sent</span>
              <span className="font-mono text-xs font-bold text-text mt-1">{schedule.sent_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-panel-strong/30 border border-border/60 flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Pending</span>
              <span className="font-mono text-xs font-bold text-text mt-1">{schedule.pending_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-panel-strong/30 border border-border/60 flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Failures</span>
              <span className="font-mono text-xs font-bold text-danger mt-1">{schedule.failure_count}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Delivery (Channels + Recipients) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Delivery Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-panel-strong/30 border border-border/40 rounded-xl space-y-2">
              <span className="text-[10px] text-text-muted uppercase font-bold">Channels</span>
              <div className="flex flex-wrap gap-1.5">
                {schedule.channels.map((ch) => (
                  <span key={ch} className="px-2.5 py-1 rounded bg-panel border border-border/60 font-mono text-xs font-bold text-text">
                    {ch}
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
        </div>

        {/* Section 3: Message Body (Scrollable, never clipped) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Message Body Preview</h3>
          <div className="overflow-y-auto max-h-[220px] p-4 rounded-xl bg-panel-strong/30 border border-border/40 font-mono text-xs text-text whitespace-pre-wrap leading-relaxed custom-scrollbar">
            {schedule.message_body || 'No message body configured.'}
          </div>
          {schedule.attachments && schedule.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {schedule.attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-panel-strong/30 border border-border/40 text-xs">
                  <FileText size={14} className="text-accent" />
                  <span className="font-mono text-text">{att}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Delivery Log & Timing */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Delivery Log & Schedule</h3>
          <div className="p-4 rounded-xl bg-panel-strong/30 border border-border/40 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted flex items-center gap-1.5">
                <Clock size={14} className="text-accent" /> Scheduled Execution:
              </span>
              <span className="font-mono font-bold text-text">{formatDateTime(schedule.scheduled_at)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/30 pt-2">
              <span className="text-text-muted">Repeat Interval:</span>
              <span className="font-mono capitalize">{schedule.repeat_interval}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-panel border-t border-border/50 flex items-center justify-between z-10 shadow-lg">
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
            <Button
              intent="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={() => onSendNow?.(schedule.id)}
            >
              Send Now
            </Button>
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

        {/* Delete in ⋯ menu (never adjacent to Send) */}
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
              label="Delete Schedule"
              onClick={() => {
                setIsMoreMenuOpen(false);
                setShowDeleteConfirm(true);
              }}
            />
          </Dropdown>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
