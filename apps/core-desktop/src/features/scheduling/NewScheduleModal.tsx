// [PHASE: MVP]
import * as React from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  DateInput,
} from '@40labs/ui-components';
import type {
  Schedule,
  ScheduleCategory,
  ScheduleType,
  ScheduleChannel,
  RecipientScope,
  RepeatInterval,
} from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, nowIso } from '../../devData';
import { requirePin } from '../customers/components/CustomerList';
import { FileText, X, Paperclip, AlertCircle } from 'lucide-react';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Schedule) => void;
  editSchedule?: Schedule | null;
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

const MESSAGE_TEMPLATES = [
  { title: 'Monthly Refill Notice', body: 'Hello {name}, your monthly chronic refill is ready at 40Labs Pharmacy. Balance due: {balance} TZS.' },
  { title: 'Tax & Sales Report', body: 'Automated daily/monthly sales and revenue ledger summary.' },
  { title: 'Promo Broadcast', body: 'Jambo {name}! Enjoy 15% off vitamins this weekend at 40Labs Afya. Reply STOP to opt out.' },
];

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editSchedule,
}) => {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form states
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<ScheduleCategory>('reports');
  const [messageBody, setMessageBody] = React.useState('');
  const [templateId, setTemplateId] = React.useState('');

  const [channels, setChannels] = React.useState<ScheduleChannel[]>(['sms']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('customers');
  const [recipientCount] = React.useState(120);

  const [scheduledDate, setScheduledDate] = React.useState('');
  const [scheduledTime, setScheduledTime] = React.useState('09:00');
  const [repeatInterval, setRepeatInterval] = React.useState<RepeatInterval>('none');
  const [repeatUntil, setRepeatUntil] = React.useState('');

  const [attachments, setAttachments] = React.useState<Array<{ name: string; size: string }>>([]);

  React.useEffect(() => {
    if (editSchedule) {
      setTitle(editSchedule.title);
      setCategory(editSchedule.category);
      setMessageBody(editSchedule.message_body);
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
      setAttachments(
        (editSchedule.attachments || []).map((att) => ({ name: att, size: '240 KB' }))
      );
    } else {
      setTitle('');
      setCategory('reports');
      setMessageBody('');
      setTemplateId('');
      setChannels(['sms']);
      setRecipientScope('customers');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setScheduledTime('09:00');
      setRepeatInterval('none');
      setRepeatUntil('');
      setAttachments([]);
      setStep(1);
    }
  }, [editSchedule, isOpen]);

  // Derived schedule type
  const derivedType: ScheduleType = React.useMemo(() => {
    const match = CATEGORY_OPTIONS.find((c) => c.value === category);
    return match ? match.defaultType : 'report';
  }, [category]);

  // SMS Segment counter (160 chars standard, 70 unicode)
  const isUnicode = /[^\u0000-\u00ff]/.test(messageBody);
  const charLimit = isUnicode ? 70 : 160;
  const segments = messageBody ? Math.ceil(messageBody.length / charLimit) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      setAttachments((prev) => [...prev, { name: file.name, size: sizeStr }]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    // Check bulk send (> 20 recipients) PIN requirement
    if (recipientScope === 'all' || recipientScope === 'customers' || recipientCount > 20) {
      const authorized = await requirePin('schedule.bulk_send');
      if (!authorized) return;
    }

    let scheduledAtIso = nowIso();
    if (scheduledDate) {
      try {
        const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (!isNaN(combined.getTime())) {
          scheduledAtIso = combined.toISOString();
        }
      } catch {}
    }

    const newSchedule: Schedule = {
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
      attachments: attachments.map((a) => a.name),
      scheduled_at: scheduledAtIso,
      repeat_interval: repeatInterval,
      repeat_until: repeatInterval !== 'none' && repeatUntil ? new Date(repeatUntil).toISOString() : null,
      status: editSchedule ? editSchedule.status : 'pending',
      sent_count: editSchedule ? editSchedule.sent_count : 0,
      pending_count: editSchedule ? editSchedule.pending_count : recipientCount,
      failure_count: editSchedule ? editSchedule.failure_count : 0,
      created_at: editSchedule ? editSchedule.created_at : nowIso(),
      updated_at: nowIso(),
    };

    onSave(newSchedule);
    onClose();
  };

  const summarySentence = `Sends ${repeatInterval === 'none' ? `on ${scheduledDate || 'today'}` : `every ${repeatInterval}`} at ${scheduledTime} to ${recipientCount} ${recipientScope} via ${channels.join(', ')}.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editSchedule ? 'Edit Scheduled Automation' : 'New Scheduled Automation'}
      size="lg"
    >
      <div className="flex flex-col gap-6 py-2 max-w-[720px] mx-auto w-full">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-accent text-white' : 'bg-panel-strong text-text-muted'}`}>1</span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-text' : 'text-text-muted'}`}>What</span>
            <div className="w-8 h-px bg-border/60 mx-1" />
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-accent text-white' : 'bg-panel-strong text-text-muted'}`}>2</span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-text' : 'text-text-muted'}`}>Who & How</span>
            <div className="w-8 h-px bg-border/60 mx-1" />
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-accent text-white' : 'bg-panel-strong text-text-muted'}`}>3</span>
            <span className={`text-xs font-semibold ${step === 3 ? 'text-text' : 'text-text-muted'}`}>When</span>
          </div>
          <span className="text-xs font-mono text-text-muted">Step {step} of 3</span>
        </div>

        {/* Step 1: What */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Automation Title <span className="text-danger">*</span></label>
                <Input
                  placeholder="e.g. Chronic Refill Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Category <span className="text-danger">*</span></label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <span className="text-[10px] text-text-muted">Type auto-derived: <strong className="font-mono text-accent">{derivedType}</strong></span>
              </div>
            </div>

            {category === 'marketing' && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Notice: Recipient list is filtered to customers with <strong>marketing_consent = true</strong>. SMS footer automatically includes 'Reply STOP to opt out'.</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-muted">Template Picker</label>
                <Select
                  value={templateId}
                  onChange={(e) => {
                    const t = MESSAGE_TEMPLATES.find((x) => x.title === e.target.value);
                    if (t) {
                      setTemplateId(t.title);
                      setMessageBody(t.body);
                    }
                  }}
                  className="w-48 text-xs h-7"
                >
                  <option value="">Choose preset template...</option>
                  {MESSAGE_TEMPLATES.map((t) => (
                    <option key={t.title} value={t.title}>{t.title}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-muted">Message Body (Inline)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMessageBody((prev) => prev + ' {name}')}
                      className="text-[10px] px-2 py-0.5 rounded bg-panel-strong border border-border text-accent font-mono cursor-pointer hover:bg-surface-strong"
                    >
                      + {'{name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageBody((prev) => prev + ' {balance}')}
                      className="text-[10px] px-2 py-0.5 rounded bg-panel-strong border border-border text-accent font-mono cursor-pointer hover:bg-surface-strong"
                    >
                      + {'{balance}'}
                    </button>
                  </div>
                </div>

                {channels.includes('whatsapp') && (
                  <div className="p-2.5 bg-danger/10 border border-danger/30 rounded-xl text-[11px] text-danger flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>Business-initiated WhatsApp messages require an approved Meta template ID. Free-text blocked.</span>
                  </div>
                )}

                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type message content with {name} and {balance} variables..."
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <span>Characters: {messageBody.length}</span>
                  <span>SMS Segments: {segments} ({charLimit} chars/seg) {isUnicode && '• Unicode'}</span>
                </div>
              </div>
            </div>

            {/* Attachments Real File Picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted">Attachments (PDF / Reports)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-panel-strong border border-border text-xs font-semibold cursor-pointer hover:bg-surface-strong">
                  <Paperclip size={14} className="text-accent" />
                  <span>Choose local file...</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className="text-[11px] text-text-muted italic">Cloud drive attachment storage</span>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel-strong border border-border text-xs">
                      <FileText size={14} className="text-accent" />
                      <span className="font-mono">{att.name} ({att.size})</span>
                      <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-text-muted hover:text-danger">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Who & How */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted">Recipients Scope</label>
              <Select
                value={recipientScope}
                onChange={(e) => setRecipientScope(e.target.value as RecipientScope)}
              >
                <option value="customers">All Customers (Filtered)</option>
                <option value="subscribers">Subscribers</option>
                <option value="staff">Staff Members</option>
                <option value="pharmacies">Connected Pharmacies</option>
                <option value="all">All Contacts in System</option>
              </Select>
              <p className="text-xs font-mono text-accent">Target Audience Count: ~{recipientCount} recipients</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted">Delivery Channels (On / Off + Configuration)</label>
              <div className="space-y-2">
                {AVAILABLE_CHANNELS.map((ch) => {
                  const isActive = channels.includes(ch.id);
                  const isMisconfigured = isActive && ch.id === 'whatsapp' && !templateId;

                  return (
                    <div key={ch.id} className="flex items-center justify-between p-3 rounded-xl bg-panel-strong/40 border border-border/40">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-text">{ch.label}</span>
                        {isMisconfigured && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-danger/20 text-danger font-semibold">
                            Needs Template ID
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          intent={isActive ? 'primary' : 'neutral'}
                          size="sm"
                          onClick={() => {
                            if (isActive) {
                              setChannels(channels.filter((c) => c !== ch.id));
                            } else {
                              setChannels([...channels, ch.id]);
                            }
                          }}
                        >
                          {isActive ? 'Enabled (ON)' : 'Disabled (OFF)'}
                        </Button>
                        {isActive && isMisconfigured && (
                          <button type="button" className="text-xs text-accent underline cursor-pointer">
                            Configure
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: When */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Scheduled Date <span className="text-danger">*</span></label>
                <DateInput
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Scheduled Time <span className="text-danger">*</span></label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Repeat Interval</label>
                <Select
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
                >
                  {REPEAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              {repeatInterval !== 'none' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Repeat Until</label>
                  <DateInput
                    value={repeatUntil}
                    onChange={(e) => setRepeatUntil(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Summary Sentence Box */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Campaign Summary</span>
              <p className="text-xs font-semibold text-text">{summarySentence}</p>
            </div>
          </div>
        )}

        {/* Stepper Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div>
            {step > 1 && (
              <Button intent="neutral" size="sm" onClick={() => setStep((s) => (s - 1) as any)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button intent="neutral" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button intent="primary" size="sm" onClick={() => setStep((s) => (s + 1) as any)}>
                Next
              </Button>
            ) : (
              <Button intent="primary" size="sm" onClick={handleSave}>
                {editSchedule ? 'Update Automation' : 'Save & Schedule'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
