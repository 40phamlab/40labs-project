import * as React from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  DateInput,
  Switch,
} from '@40labs/ui-components';
import type {
  Schedule,
  ScheduleCategory,
  ScheduleType,
  ScheduleChannel,
  RecipientScope,
  RepeatInterval,
  ScheduleAttachment,
} from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, nowIso } from '../../devData';
import { CollapsibleSection } from './components/CollapsibleSection';
import { AttachmentPicker } from './components/AttachmentPicker';

interface NewScheduleModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (schedule: Schedule) => void;
  readonly editSchedule?: Schedule | null;
}

const CATEGORY_OPTIONS: Array<{ label: string; value: ScheduleCategory; defaultType: ScheduleType }> = [
  { label: 'Reports & Exports', value: 'reports', defaultType: 'report' },
  { label: 'Marketing & Promos', value: 'marketing', defaultType: 'broadcast' },
  { label: 'Patient Refills', value: 'patients', defaultType: 'refill' },
  { label: 'Government & Reg', value: 'gov', defaultType: 'report' },
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
  const [channels, setChannels] = React.useState<ScheduleChannel[]>(['sms']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('customers');
  const [recipientCount] = React.useState(120);

  const [scheduledDate, setScheduledDate] = React.useState('');
  const [scheduledTime, setScheduledTime] = React.useState('09:00');
  const [repeatInterval, setRepeatInterval] = React.useState<RepeatInterval>('none');
  const [repeatUntil, setRepeatUntil] = React.useState('');

  const [messageBody, setMessageBody] = React.useState('');
  const [attachments, setAttachments] = React.useState<ScheduleAttachment[]>([]);
  const [enabled, setEnabled] = React.useState(true);

  const [titleError, setTitleError] = React.useState(false);

  React.useEffect(() => {
    if (editSchedule) {
      setTitle(editSchedule.title);
      setCategory(editSchedule.category);
      setMessageBody(editSchedule.message_body || '');
      setChannels(editSchedule.channels || ['sms']);
      setRecipientScope(editSchedule.recipient_scope);
      try {
        const d = new Date(editSchedule.scheduled_at);
        setScheduledDate(d.toISOString().split('T')[0]);
        setScheduledTime(d.toTimeString().slice(0, 5));
      } catch {
        setScheduledDate('');
      }
      setRepeatInterval(editSchedule.repeat_interval);
      setRepeatUntil(editSchedule.repeat_until || '');
      setAttachments((editSchedule.attachments || []).map((att) => {
        if (typeof att === 'string') {
          return { kind: 'file', file_id: att, name: att, size: '240 KB' };
        }
        return att;
      }));
      setEnabled(editSchedule.enabled !== false);
    } else {
      setTitle('');
      setCategory('reports');
      setMessageBody('');
      setChannels(['sms']);
      setRecipientScope('customers');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setScheduledTime('09:00');
      setRepeatInterval('none');
      setRepeatUntil('');
      setAttachments([]);
      setEnabled(true);
    }
    setTitleError(false);
  }, [editSchedule, isOpen]);

  const derivedType: ScheduleType = React.useMemo(() => {
    const match = CATEGORY_OPTIONS.find((c) => c.value === category);
    return match ? match.defaultType : 'report';
  }, [category]);

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setTitleError(false);

    let scheduledAtIso = nowIso();
    if (scheduledDate) {
      try {
        const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (!isNaN(combined.getTime())) {
          scheduledAtIso = combined.toISOString();
        }
      } catch {}
    }

    const savedSchedule: Schedule = {
      id: editSchedule ? editSchedule.id : `sch_dev_${Date.now()}`,
      workspace_id: editSchedule ? editSchedule.workspace_id : WORKSPACE_ID,
      branch_id: editSchedule ? editSchedule.branch_id : BRANCH_ID,
      title: title.trim(),
      category,
      schedule_type: derivedType,
      channels,
      recipient_scope: recipientScope,
      recipient_ids: null,
      message_body: messageBody.trim(),
      attachments: attachments as any,
      scheduled_at: scheduledAtIso,
      repeat_interval: repeatInterval,
      repeat_until: repeatInterval !== 'none' && repeatUntil ? new Date(repeatUntil).toISOString() : null,
      status: editSchedule ? editSchedule.status : 'pending',
      enabled,
      sent_count: editSchedule ? editSchedule.sent_count : 0,
      pending_count: editSchedule ? editSchedule.pending_count : recipientCount,
      failure_count: editSchedule ? editSchedule.failure_count : 0,
      created_at: editSchedule ? editSchedule.created_at : nowIso(),
      updated_at: nowIso(),
    };

    onSave(savedSchedule);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editSchedule ? 'Edit Schedule' : 'New Schedule'}
      size="lg"
    >
      <div className="flex flex-col gap-6 py-2 max-w-[720px] mx-auto w-full">
        {/* Top-level required fields only, always visible */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Title</label>
              <Input
                placeholder="Schedule title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(false);
                }}
                className={titleError ? 'border-danger' : ''}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Recipients</label>
              <Select
                value={recipientScope}
                onChange={(e) => setRecipientScope(e.target.value as RecipientScope)}
              >
                <option value="customers">All Customers</option>
                <option value="subscribers">Subscribers</option>
                <option value="staff">Staff Members</option>
                <option value="pharmacies">Pharmacies</option>
                <option value="all">All Contacts</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Channels</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AVAILABLE_CHANNELS.map((ch) => {
                  const active = channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        if (active) setChannels(channels.filter((c) => c !== ch.id));
                        else setChannels([...channels, ch.id]);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono border cursor-pointer ${
                        active ? 'bg-panel-strong border-accent text-accent font-bold' : 'bg-panel border-border/60 text-text-muted'
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Date</label>
              <DateInput
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Time</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text">Repeat</label>
              <Select
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
              >
                {REPEAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Collapsible Section: Message */}
        <CollapsibleSection title="Message" defaultOpen={Boolean(messageBody.trim())}>
          <Textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type message preview..."
            className="min-h-[100px]"
          />
        </CollapsibleSection>

        {/* Collapsible Section: Attach */}
        <CollapsibleSection title="Attachments" defaultOpen={attachments.length > 0}>
          <AttachmentPicker
            attachments={attachments}
            onChange={setAttachments}
            repeatInterval={repeatInterval}
          />
        </CollapsibleSection>

        {/* Footer: Active switch, Cancel and Save */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onChange={setEnabled}
            />
            <span className="text-xs font-bold text-text">Active</span>
          </div>

          <div className="flex gap-3">
            <Button intent="neutral" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              intent="primary"
              size="sm"
              onClick={handleSave}
              style={{ backgroundColor: '#16A34A' }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
