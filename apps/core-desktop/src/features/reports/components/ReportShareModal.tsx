import * as React from 'react';
import {
  Modal,
  Button,
  Select,
  Textarea,
  Checkbox,
  SearchInput,
} from '@40labs/ui-components';
import { ScheduleChannel, RecipientScope } from '@40labs/types';
import { FileText, Send, Check } from 'lucide-react';
import { initialCustomers } from '../../../devData/customers/customers';
import { initialUsers } from '../../../devData/users/staff';

export interface ReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  periodLabel: string;
  onShareComplete?: (channelSummary: string) => void;
}

const SHARE_CHANNELS: Array<{ id: ScheduleChannel; label: string; description: string }> = [
  { id: 'whatsapp', label: 'WhatsApp', description: 'Send PDF report directly to contact' },
  { id: 'gmail', label: 'Gmail / Email', description: 'Dispatch via email outbox as an attachment' },
  { id: 'google_drive', label: 'Google Drive', description: 'Sync report directly to cloud storage folder' },
  { id: 'in_app', label: 'In-App Notification', description: 'Notify team members inside 40Labs Core' },
];

export const ReportShareModal: React.FC<ReportShareModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  periodLabel,
  onShareComplete,
}) => {
  const [selectedChannels, setSelectedChannels] = React.useState<ScheduleChannel[]>(['gmail']);
  const [recipientScope, setRecipientScope] = React.useState<RecipientScope>('staff');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedChannels(['gmail']);
      setRecipientScope('staff');
      setSelectedRecipientIds(['user_001']);
      setMessage(`Attached report: ${reportTitle} (${periodLabel}).`);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, reportTitle, periodLabel]);

  const contacts = React.useMemo(() => {
    let list = recipientScope === 'staff'
      ? initialUsers.map((u) => ({ id: u.id, name: u.full_name, detail: `${u.role.toUpperCase()} (Staff User)` }))
      : initialCustomers.map((c) => ({ id: c.id, name: c.full_name, detail: `${c.phone} · ${c.email || 'No email'}` }));

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q));
  }, [recipientScope, searchQuery]);

  const toggleChannel = (ch: ScheduleChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter((c) => c !== ch) : prev) : [...prev, ch]
    );
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDispatch = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      const summary = `Shared ${reportTitle} via ${selectedChannels.join(', ')}`;
      if (onShareComplete) {
        onShareComplete(summary);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    }, 600);
  };

  const filename = `${reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Dispatch Report"
      size="md"
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Attachment Preview Box */}
        <div className="p-3 bg-panel rounded-card border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-input bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text">{filename}</span>
              <span className="text-[10px] text-text-muted font-mono">{periodLabel} · PDF Document</span>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
            Ready to attach
          </span>
        </div>

        {/* Channel Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Delivery Channels (Select at least 1)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHARE_CHANNELS.map((ch) => {
              const active = selectedChannels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`p-2.5 rounded-input border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    active
                      ? 'bg-panel-strong border-primary/50 text-text elevation-raised'
                      : 'bg-panel border-border/50 text-text-muted hover:text-text'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ch.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[10px] text-text-muted truncate">{ch.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipient Config */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Recipient Group</label>
            <Select
              size="sm"
              value={recipientScope}
              onChange={(e) => setRecipientScope(e.target.value as RecipientScope)}
            >
              <option value="staff">Internal Staff / Owners</option>
              <option value="customers">Customers</option>
              <option value="all">All Contacts</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Filter Recipients</label>
            <SearchInput
              placeholder="Search recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-[160px] overflow-y-auto p-2 bg-panel rounded-card border border-border/50 flex flex-col gap-1.5">
          {contacts.map((contact) => {
            const checked = selectedRecipientIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => toggleRecipient(contact.id)}
                className="flex items-center justify-between p-2 rounded-input bg-surface hover:bg-surface-strong cursor-pointer border border-border/30"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={checked} onChange={() => toggleRecipient(contact.id)} />
                  <span className="text-xs font-bold text-text">{contact.name}</span>
                </div>
                <span className="text-[10px] text-text-muted font-mono">{contact.detail}</span>
              </div>
            );
          })}
        </div>

        {/* Optional Message */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Cover Note / Message Body
          </label>
          <Textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add an optional message..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" intent="neutral" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={isSuccess ? <Check size={14} /> : <Send size={14} />}
            onClick={handleDispatch}
            loading={isSubmitting}
          >
            {isSuccess ? 'Report Dispatched!' : 'Share & Queue Outbox'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
