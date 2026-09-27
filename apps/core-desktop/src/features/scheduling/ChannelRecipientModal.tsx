import * as React from 'react';
import {
  Modal,
  Button,
  SearchInput,
  Select,
  Checkbox,
} from '@40labs/ui-components';
import { ScheduleChannel, RecipientScope } from '@40labs/types';
import { initialCustomers } from '../../devData/customers/customers';
import { initialUsers } from '../../devData/users/staff';

interface ChannelRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ScheduleChannel;
  currentScope: RecipientScope;
  currentRecipientIds: string[] | null;
  onSet: (scope: RecipientScope, recipientIds: string[] | null) => void;
}

const SCOPE_OPTIONS = [
  { label: 'All Contacts', value: 'all' },
  { label: 'Customers', value: 'customers' },
  { label: 'Staff Members', value: 'staff' },
  { label: 'Chronic Subscribers', value: 'subscribers' },
  { label: 'Partner Pharmacies', value: 'pharmacies' },
  { label: 'Custom Selection', value: 'custom' },
];

const CHANNEL_NAMES: Record<ScheduleChannel, string> = {
  sms: 'SMS Channel',
  whatsapp: 'WhatsApp Channel',
  in_app: 'In-App Notification',
  google_drive: 'Google Drive Sync',
  gmail: 'Gmail Outbox',
};

export const ChannelRecipientModal: React.FC<ChannelRecipientModalProps> = ({
  isOpen,
  onClose,
  channel,
  currentScope,
  currentRecipientIds,
  onSet,
}) => {
  const [scope, setScope] = React.useState<RecipientScope>(currentScope);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(
    currentRecipientIds || []
  );

  React.useEffect(() => {
    if (isOpen) {
      setScope(currentScope);
      setSelectedIds(currentRecipientIds || []);
    }
  }, [isOpen, currentScope, currentRecipientIds]);

  const contacts = React.useMemo(() => {
    let list: Array<{ id: string; name: string; detail: string }> = [];
    if (scope === 'staff') {
      list = initialUsers.map((s: any) => ({
        id: s.id,
        name: s.full_name,
        detail: `${s.role} (${s.email || s.phone || 'Staff'})`,
      }));
    } else {
      list = initialCustomers.map((c: any) => ({
        id: c.id,
        name: c.full_name,
        detail: `${c.phone} · ${c.email || 'No email'}`,
      }));
    }

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
    );
  }, [scope, searchQuery]);

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(contacts.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSave = () => {
    onSet(scope, scope === 'custom' || scope === 'staff' || scope === 'customers' ? selectedIds : null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${CHANNEL_NAMES[channel]} Recipients`}
      size="md"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-panel-strong text-text-muted font-mono text-xs font-bold uppercase border border-border/40">
            {channel}
          </span>
          <span className="text-xs text-text-muted">
            Configure target audience and recipient routing for {CHANNEL_NAMES[channel]}.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-text-muted">Recipient Scope</label>
            <Select
              value={scope}
              onChange={(e) => setScope(e.target.value as RecipientScope)}
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-text-muted">Search Contacts</label>
            <SearchInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-input bg-surface border border-border">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onChange={(e) => handleToggleAll(e.target.checked)}
              label="Select All Filtered Contacts"
            />
          </div>
          <span className="font-mono text-xs text-text-muted">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar border border-border/50 rounded-card p-2 bg-panel">
          {contacts.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">No matching contacts found.</p>
          ) : (
            contacts.map((contact) => {
              const isChecked = selectedIds.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => handleToggleOne(contact.id, !isChecked)}
                  className="flex items-center justify-between px-3 py-2 rounded-input bg-surface hover:bg-surface-strong border border-border/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => handleToggleOne(contact.id, e.target.checked)}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text">{contact.name}</span>
                      <span className="text-[11px] text-text-muted font-mono">{contact.detail}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" intent="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" intent="primary" size="sm" onClick={handleSave}>
            Set Recipients
          </Button>
        </div>
      </div>
    </Modal>
  );
};
