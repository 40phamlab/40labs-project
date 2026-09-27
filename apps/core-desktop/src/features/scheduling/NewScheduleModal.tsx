import * as React from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  DateInput,
} from '@40labs/ui-components';
import {
  Schedule,
  ScheduleCategory,
  ScheduleType,
  ScheduleChannel,
  RecipientScope,
  RepeatInterval,
} from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, nowIso } from '../../devData';
import { ChannelRecipientModal } from './ChannelRecipientModal';
import { FileText, Plus, X, MessageSquare } from 'lucide-react';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Schedule) => void;
  editSchedule?: Schedule | null;
}

const CATEGORY_OPTIONS = [
  { label: 'Reports & Exports', value: 'reports' },
  { label: 'Marketing & Promos', value: 'marketing' },
  { label: 'Patient Refills', value: 'patients' },
  { label: 'Government & Reg', value: 'gov' },
];

const TYPE_OPTIONS = [
  { label: 'Report / Export', value: 'report' },
  { label: 'Reminder / Broadcast', value: 'reminder' },
  { label: 'Refill Notice', value: 'refill' },
];

const REPEAT_OPTIONS = [
  { label: 'None (One-off)', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const AVAILABLE_CHANNELS: Array<{ id: ScheduleChannel; label: string }> = [
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'in_app', label: 'In App' },
  { id: 'google_drive', label: 'Google Drive' },
  { id: 'gmail', label: 'Gmail' },
];

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editSchedule,
}) => {
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<ScheduleCategory>('reports');
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>('report');
  const [channels, setChannels] = React.useState<ScheduleChannel[]>(['sms']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('all');
  const [recipientIds, setRecipientIds] = React.useState<string[] | null>(null);
  const [messageBody, setMessageBody] = React.useState('');
  const [isMsgExpanded, setIsMsgExpanded] = React.useState(false);

  const [scheduledDate, setScheduledDate] = React.useState('');
  const [scheduledTime, setScheduledTime] = React.useState('08:00');

  const [repeatInterval, setRepeatInterval] = React.useState<RepeatInterval>('none');
  const [repeatUntil, setRepeatUntil] = React.useState('');
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [newAttachmentInput, setNewAttachmentInput] = React.useState('');

  const [activeChannelForModal, setActiveChannelForModal] = React.useState<ScheduleChannel | null>(null);

  React.useEffect(() => {
    if (editSchedule) {
      setTitle(editSchedule.title);
      setCategory(editSchedule.category);
      setScheduleType(editSchedule.schedule_type);
      setChannels(editSchedule.channels || ['sms']);
      setRecipientScope(editSchedule.recipient_scope);
      setRecipientIds(editSchedule.recipient_ids);
      setMessageBody(editSchedule.message_body);
      setIsMsgExpanded(Boolean(editSchedule.message_body));

      try {
        const d = new Date(editSchedule.scheduled_at);
        setScheduledDate(d.toISOString().split('T')[0]);
        setScheduledTime(d.toTimeString().slice(0, 5));
      } catch {
        setScheduledDate('');
      }

      setRepeatInterval(editSchedule.repeat_interval);
      setRepeatUntil(editSchedule.repeat_until || '');
      setAttachments(editSchedule.attachments || []);
    } else {
      setTitle('');
      setCategory('reports');
      setScheduleType('report');
      setChannels(['sms']);
      setRecipientScope('all');
      setRecipientIds(null);
      setMessageBody('');
      setIsMsgExpanded(false);
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setScheduledTime('09:00');
      setRepeatInterval('none');
      setRepeatUntil('');
      setAttachments([]);
    }
  }, [editSchedule, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let scheduledAtIso = nowIso();
    if (scheduledDate) {
      try {
        const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (!isNaN(combined.getTime())) {
          scheduledAtIso = combined.toISOString();
        }
      } catch {
        // fallback
      }
    }

    const newSchedule: Schedule = {
      id: editSchedule ? editSchedule.id : `sch_dev_${Date.now()}`,
      workspace_id: editSchedule ? editSchedule.workspace_id : WORKSPACE_ID,
      branch_id: editSchedule ? editSchedule.branch_id : BRANCH_ID,
      title: title.trim(),
      category,
      schedule_type: scheduleType,
      channels,
      recipient_scope: recipientScope,
      recipient_ids: recipientIds,
      message_body: messageBody.trim(),
      attachments: attachments.length > 0 ? attachments : null,
      scheduled_at: scheduledAtIso,
      repeat_interval: repeatInterval,
      repeat_until: repeatInterval !== 'none' && repeatUntil ? new Date(repeatUntil).toISOString() : null,
      status: editSchedule ? editSchedule.status : 'pending',
      sent_count: editSchedule ? editSchedule.sent_count : 0,
      pending_count: editSchedule ? editSchedule.pending_count : 1,
      failure_count: editSchedule ? editSchedule.failure_count : 0,
      created_at: editSchedule ? editSchedule.created_at : nowIso(),
      updated_at: nowIso(),
    };

    onSave(newSchedule);
    onClose();
  };

  const receiverSummary = React.useMemo(() => {
    const count = recipientIds ? recipientIds.length : 'All';
    return `${recipientScope.toUpperCase()} (${count} recipients configured)`;
  }, [recipientScope, recipientIds]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editSchedule ? 'Edit Scheduled Job' : 'New Scheduled Automation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Schedule Title <span className="text-danger">*</span></label>
              <Input
                placeholder="e.g. Monthly Tax & Sales Export"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Category <span className="text-danger">*</span></label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Schedule Type <span className="text-danger">*</span></label>
              <Select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Receiver's Name / Scope (Derived)</label>
              <div className="px-3 py-2 rounded-input bg-surface border border-border text-xs font-mono text-text flex items-center justify-between">
                <span className="truncate">{receiverSummary}</span>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Auto-resolved</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Delivery Channels (Click channel to configure recipients)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CHANNELS.map((ch) => {
                const isSelected = channels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChannelForModal(ch.id)}
                    className={`px-3 py-1.5 rounded-input text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-panel-strong border-border elevation-inset text-text font-bold'
                        : 'bg-panel text-text border-border/60 hover:bg-surface-strong'
                    }`}
                  >
                    <span>{ch.label}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-panel border border-border/40 text-text' : 'bg-surface text-text-muted'}`}>
                      {isSelected ? 'Active' : 'Configure'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Scheduled Date <span className="text-danger">*</span></label>
              <DateInput
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Scheduled Time <span className="text-danger">*</span></label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-text-muted">Repeat Interval <span className="text-danger">*</span></label>
              <Select
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
              >
                {REPEAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            {repeatInterval !== 'none' ? (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-medium text-text-muted">Repeat Until</label>
                <DateInput
                  value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                />
              </div>
            ) : (
              <div className="text-xs text-text-muted italic py-2">
                One-off schedule (does not repeat).
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                Message Body & Template
              </label>
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<MessageSquare size={14} />}
                onClick={() => setIsMsgExpanded(!isMsgExpanded)}
              >
                {isMsgExpanded ? 'Hide Message Editor' : 'MSG (Edit Message)'}
              </Button>
            </div>

            {isMsgExpanded && (
              <Textarea
                placeholder="Enter notification message body, variables like {{customer_name}} are supported..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={3}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Attachments & Files (Stubbed filename storage)
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. monthly_report.pdf"
                value={newAttachmentInput}
                onChange={(e) => setNewAttachmentInput(e.target.value)}
              />
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  if (!newAttachmentInput.trim()) return;
                  setAttachments([...attachments, newAttachmentInput.trim()]);
                  setNewAttachmentInput('');
                }}
              >
                Add File
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {attachments.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs font-mono text-text"
                  >
                    <FileText size={12} className="text-[var(--color-primary)]" />
                    <span>{file}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-text-muted hover:text-[var(--color-danger)]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button type="button" intent="neutral" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" intent="primary" size="sm">
              {editSchedule ? 'Save Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {activeChannelForModal && (
        <ChannelRecipientModal
          isOpen={Boolean(activeChannelForModal)}
          onClose={() => setActiveChannelForModal(null)}
          channel={activeChannelForModal}
          currentScope={recipientScope}
          currentRecipientIds={recipientIds}
          onSet={(scope, ids) => {
            setRecipientScope(scope);
            setRecipientIds(ids);
          }}
        />
      )}
    </>
  );
};
