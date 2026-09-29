import * as React from 'react';
import {
  Button,
  IconButton,
  SearchInput,
  Avatar,
  Badge,
  Textarea,
} from '@40labs/ui-components';
import { X, UserCheck, MessageSquare, Send } from 'lucide-react';
import type { MessageChannel } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { initialCustomers } from '../../../devData/customers/customers';
import { initialUsers } from '../../../devData/users/staff';
import { ChannelIcon } from './ChannelIndicator';

export interface ContactOption {
  id: string;
  name: string;
  type:
    | 'Customer'
    | 'Patient'
    | 'Staff'
    | 'Doctor'
    | 'Pharmacist'
    | 'Laboratory staff'
    | 'Clinic staff'
    | 'Organization';
  identifier: string;
  email?: string | null;
}

const ALL_CONTACTS: ContactOption[] = [
  ...initialCustomers.map((c) => ({
    id: c.id,
    name: c.full_name,
    type: 'Customer' as ContactOption['type'],
    identifier: c.phone || c.email || c.id,
    email: c.email,
  })),
  ...initialUsers.map((u) => ({
    id: u.id,
    name: u.full_name,
    type: (u.role === 'sudo' ? 'Staff' : 'Doctor') as ContactOption['type'],
    identifier: `Staff ID: ${u.id}`,
    email: null,
  })),
  {
    id: 'pat_001',
    name: 'Dr. Joseph Mwakyusa',
    type: 'Doctor',
    identifier: '+255 712 998 877',
    email: 'joseph.m@40labs.clinic',
  },
  {
    id: 'pat_002',
    name: 'Amina Kassim',
    type: 'Patient',
    identifier: '+255 784 556 677',
    email: null,
  },
  {
    id: 'org_001',
    name: 'TMDA Regulatory Affairs',
    type: 'Organization',
    identifier: 'Gov #TMDA-2026-99',
    email: 'info@tmda.go.tz',
  },
];

const contactTypeBadgeVariants: Record<
  ContactOption['type'],
  'primary' | 'neutral' | 'warning' | 'surface'
> = {
  Customer: 'primary',
  Patient: 'primary',
  Staff: 'neutral',
  Doctor: 'warning',
  Pharmacist: 'warning',
  'Laboratory staff': 'neutral',
  'Clinic staff': 'neutral',
  Organization: 'surface',
};

const CHANNELS: MessageChannel[] = ['amob', 'whatsapp', 'sms', 'email'];

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (contact: ContactOption, initialMessage: string, channel: MessageChannel) => Promise<void>;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onStartConversation,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedContact, setSelectedContact] = React.useState<ContactOption | null>(null);
  const [selectedChannel, setSelectedChannel] = React.useState<MessageChannel>('whatsapp');
  const [initialMessage, setInitialMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedContact(null);
      setSelectedChannel('whatsapp');
      setInitialMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) return ALL_CONTACTS.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return ALL_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleContinue = async () => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    try {
      await onStartConversation(selectedContact, initialMessage.trim(), selectedChannel);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fadeIn p-4">
      <div className="w-full max-w-lg bg-panel border border-border/60 rounded-card shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-panel-strong/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">New Conversation</h2>
              <p className="text-[11px] text-text-muted">Select a recipient and channel to start messaging</p>
            </div>
          </div>
          <IconButton
            icon={<X size={16} />}
            label="Close"
            intent="ghost"
            size="sm"
            onClick={onClose}
            className="text-text-muted hover:text-text"
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Recipient Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">To:</label>
            <div className="relative">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, patient, staff, doctor, ID, phone..."
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Selected Contact Preview (if any) */}
          {selectedContact && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-card animate-fadeIn">
              <div className="flex items-center gap-3">
                <Avatar name={selectedContact.name} size="sm" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text">{selectedContact.name}</span>
                  <span className="text-[10px] text-text-muted font-mono">{selectedContact.identifier}</span>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                {selectedContact.type}
              </Badge>
            </div>
          )}

          {/* Channel Selection */}
          {selectedContact && (
            <div className="flex flex-col gap-2 animate-fadeIn">
              <label className="text-xs font-semibold text-text">Channel:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHANNELS.map((ch) => {
                  const cfg = CHANNEL_CONFIGS[ch];
                  const isSelected = selectedChannel === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`
                        flex items-center gap-2 p-2.5 rounded-card border transition-all cursor-pointer text-left
                        ${
                          isSelected
                            ? 'bg-primary/15 border-primary shadow-2xs font-bold text-text'
                            : 'bg-panel-strong/30 border-border/30 hover:bg-panel-strong/60 text-text-muted'
                        }
                      `}
                    >
                      <ChannelIcon channel={ch} size={16} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-text truncate">{cfg.displayName}</span>
                        <span className="text-[9px] text-text-muted truncate">{cfg.accessibleLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Initial Message Input (Optional) */}
          {selectedContact && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-text">Initial Message (Optional):</label>
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder={`Type your first message via ${CHANNEL_CONFIGS[selectedChannel].displayName}...`}
                className="text-xs min-h-[70px] max-h-[120px]"
              />
            </div>
          )}

          {/* Contact Results List */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1">
              {searchQuery.trim() ? 'Search Results' : 'Suggested & Recent Contacts'}
            </span>

            <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border/40 rounded-card">
                  No contacts found matching "{searchQuery}".
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`flex items-center justify-between p-2.5 rounded-card cursor-pointer transition-colors border ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40'
                          : 'bg-panel-strong/30 border-border/20 hover:bg-panel-strong/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={contact.name} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-text truncate">{contact.name}</span>
                          <span className="text-[10px] text-text-muted font-mono">{contact.identifier}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={contactTypeBadgeVariants[contact.type] || 'neutral'} size="sm">
                          {contact.type}
                        </Badge>
                        {isSelected && <UserCheck size={14} className="text-primary" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/30 bg-panel-strong/40">
          <Button
            type="button"
            intent="neutral"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            size="sm"
            disabled={!selectedContact || isSubmitting}
            onClick={handleContinue}
            className="text-xs px-4"
            rightIcon={<Send size={12} />}
          >
            {isSubmitting ? 'Starting...' : 'Start Conversation'}
          </Button>
        </div>
      </div>
    </div>
  );
};
