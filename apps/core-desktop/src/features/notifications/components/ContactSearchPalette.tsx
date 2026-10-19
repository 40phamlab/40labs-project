import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '@40labs/ui-components';
import { t, Language } from '@40labs/i18n';
import type { CounterpartyType } from '@40labs/types';
import { customersApi } from '../../../api/customersApi';
import { partnerFacilitiesApi } from '../../../api/partnerFacilitiesApi';
import { NotificationAvatar } from './NotificationAvatar';

export interface SearchContact {
  id: string;
  name: string;
  phone: string;
  type: 'Customer' | 'Partner';
  counterpartyType: CounterpartyType;
  counterpartyKey: string;
}

export interface ContactSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: SearchContact) => Promise<void> | void;
  title?: string;
  lang?: Language;
}

export const ContactSearchPalette: React.FC<ContactSearchPaletteProps> = ({
  isOpen,
  onClose,
  onSelectContact,
  title,
  lang = 'sw-TZ',
}) => {
  const [query, setQuery] = React.useState('');
  const [contacts, setContacts] = React.useState<SearchContact[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [custs, parts] = await Promise.all([
        customersApi.list(),
        partnerFacilitiesApi.list().catch(() => []),
      ]);

      const list: SearchContact[] = [
        ...custs
          .filter((c) => !c.archived_at)
          .map((c) => ({
            id: c.id,
            name: c.full_name,
            phone: c.phone || 'No phone',
            type: 'Customer' as const,
            counterpartyType: 'customer' as CounterpartyType,
            counterpartyKey: `customer:${c.id}`,
          })),
        ...parts
          .filter((p) => p.status === 'active')
          .map((p) => ({
            id: p.id,
            name: p.name,
            phone: p.contacts.mobile || p.contacts.whatsapp || 'No phone',
            type: 'Partner' as const,
            counterpartyType: 'business' as CounterpartyType,
            counterpartyKey: `business:${p.name.toLowerCase().trim()}`,
          })),
      ];
      setContacts(list);
    } catch (err) {
      console.error('Failed to load contacts for search palette:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      void loadData();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, loadData]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        await onSelectContact(target);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="w-full max-w-xl bg-panel rounded-card border border-border/60 shadow-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-panel-strong/40">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={title || t('notifications.launchpad.searchCustomer', lang)}
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted font-bold">
              {t('notifications.chat.noResults', lang)}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    await onSelectContact(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors cursor-pointer
                    ${isSelected ? 'bg-primary/15 border border-primary/40' : 'hover:bg-panel-strong/60 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <NotificationAvatar name={item.name} counterpartyType={item.counterpartyType} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text truncate">{item.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">{item.phone}</span>
                    </div>
                  </div>
                  <Badge variant={item.type === 'Customer' ? 'primary' : 'success'} size="sm">
                    {item.type}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
