import * as React from 'react';
import { Button, IconButton, SearchInput, Avatar, Badge } from '@40labs/ui-components';
import { X, UserCheck, MessageSquare, Send, Users, RotateCw } from 'lucide-react';
import { customersApi } from '../../../api/customersApi';
import { CHANNEL_CONFIGS, type Customer, type MessageChannel } from '@40labs/types';
import { ChannelIcon } from './ChannelIndicator';

export interface ContactOption {
  id: string;
  name: string;
  type: 'Customer';
  identifier: string;
  email?: string | null;
}

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (contacts: ContactOption[], channel: MessageChannel) => Promise<{ failedContactIds: string[]; createdCount: number }>;
}

const toContact = (customer: Customer): ContactOption => ({
  id: customer.id,
  name: customer.full_name,
  type: 'Customer',
  identifier: customer.phone || customer.email || customer.id,
  email: customer.email,
});

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onStartConversation,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [customers, setCustomers] = React.useState<ContactOption[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [selectedChannel, setSelectedChannel] = React.useState<MessageChannel | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  const loadCustomers = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await customersApi.list();
      setCustomers(result.filter((customer) => !customer.archived_at).map(toContact));
    } catch (error) {
      console.error('Unable to load chat contacts:', error);
      setLoadError('Could not load customers from this workspace. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIds(new Set());
      setSelectedChannel(null);
      setSubmitMessage(null);
      void loadCustomers();
    } else {
      setCustomers([]);
      setLoadError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, loadCustomers]);

  const filteredContacts = React.useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return customers;
    return customers.filter((contact) => contact.name.toLocaleLowerCase().includes(query));
  }, [customers, searchQuery]);

  if (!isOpen) return null;

  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every((contact) => selectedIds.has(contact.id));
  const selectedContacts = customers.filter((contact) => selectedIds.has(contact.id));
  const toggleContact = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filteredContacts.forEach((contact) => next.delete(contact.id));
      else filteredContacts.forEach((contact) => next.add(contact.id));
      return next;
    });
  };

  const handleStart = async () => {
    if (selectedContacts.length === 0 || !selectedChannel || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onStartConversation(selectedContacts, selectedChannel);
      if (result.failedContactIds.length > 0) {
        setSelectedIds(new Set(result.failedContactIds));
        setSubmitMessage(`${result.createdCount} direct chat(s) started. ${result.failedContactIds.length} customer(s) did not start; they remain selected so you can retry.`);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Unable to start direct chats:', error);
      setSubmitMessage('Could not start the direct chats. Your selection is still here; try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-border/60 bg-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-border/30 bg-panel-strong/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><MessageSquare size={16} /></div>
            <div>
              <h2 className="text-sm font-bold text-text">Start Direct Chat</h2>
              <p className="text-[11px] text-text-muted">Each selected customer gets a separate conversation.</p>
            </div>
          </div>
          <IconButton icon={<X size={16} />} label="Close" intent="ghost" size="sm" onClick={onClose} className="text-text-muted hover:text-text" />
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-5 custom-scrollbar">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-text">
            Search customers by name
            <SearchInput value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search customer name..." className="w-full text-xs" />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-text-muted">{selectedIds.size} selected</span>
            <div className="flex items-center gap-3">
              <button type="button" disabled={filteredContacts.length === 0 || isLoading} onClick={toggleVisible} className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50">
                {allVisibleSelected ? 'Clear visible' : `Select all ${searchQuery.trim() ? 'results' : 'customers'}`}
              </button>
              {selectedIds.size > 0 && <button type="button" onClick={() => setSelectedIds(new Set())} className="text-[11px] text-text-muted hover:text-text">Clear selection</button>}
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-text-muted">Loading customers from this workspace…</div>
          ) : loadError ? (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-center text-xs text-danger">
              <span>{loadError}</span>
              <Button type="button" intent="neutral" size="sm" onClick={() => void loadCustomers()} leftIcon={<RotateCw size={13} />}>Retry</Button>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="rounded-card border border-dashed border-border/40 p-8 text-center text-xs text-text-muted">
              {customers.length === 0 ? 'No active customers are available to chat with.' : `No customer names match “${searchQuery}”.`}
            </div>
          ) : (
            <div className="flex max-h-[42vh] flex-col gap-1 overflow-y-auto custom-scrollbar">
              {filteredContacts.map((contact) => {
                const selected = selectedIds.has(contact.id);
                return (
                  <button key={contact.id} type="button" aria-pressed={selected} onClick={() => toggleContact(contact.id)} className={`flex w-full items-center justify-between gap-3 rounded-card border p-2.5 text-left transition-colors ${selected ? 'border-primary/50 bg-primary/10' : 'border-border/30 bg-panel-strong/30 hover:bg-panel-strong/60'}`}>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={contact.name} size="sm" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-text">{contact.name}</span>
                        <span className="truncate text-[10px] text-text-muted">{contact.identifier}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant="primary" size="sm">Customer</Badge>
                      {selected ? <UserCheck size={15} className="text-primary" /> : <span className="h-4 w-4 rounded border border-border/60" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedContacts.length > 1 && <div className="flex items-center gap-2 rounded-card border border-primary/25 bg-primary/5 p-2.5 text-[11px] text-text-muted"><Users size={14} className="shrink-0 text-primary" /> Starting {selectedContacts.length} separate direct conversations.</div>}
          {selectedContacts.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-text">Choose a channel</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['email', 'sms', 'amob', 'whatsapp'] as const).map((channel) => {
                  const selected = selectedChannel === channel;
                  const label = channel === 'email' ? 'Gmail' : CHANNEL_CONFIGS[channel].displayName;
                  return (
                    <button
                      key={channel}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center gap-2 rounded-card border p-2.5 text-left transition-colors ${selected ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30' : 'border-border/40 bg-panel-strong/30 hover:bg-panel-strong/60'}`}
                    >
                      <ChannelIcon channel={channel} size={16} />
                      <span className="text-xs font-semibold text-text">{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          {submitMessage && <div role="status" className="rounded-card border border-warning/30 bg-warning/10 p-2.5 text-xs text-text">{submitMessage}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/30 bg-panel-strong/40 px-5 py-3.5">
          <Button type="button" intent="neutral" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button type="button" intent="primary" size="sm" disabled={selectedContacts.length === 0 || !selectedChannel || isSubmitting || isLoading} onClick={() => void handleStart()} className="px-4 text-xs" rightIcon={<Send size={12} />}>
            {isSubmitting ? 'Starting…' : `Start Direct Chat${selectedContacts.length > 1 ? ` (${selectedContacts.length})` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
