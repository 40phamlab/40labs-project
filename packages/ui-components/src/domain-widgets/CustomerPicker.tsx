import * as React from 'react';
import { User, UserPlus, Search, X, AlertCircle } from 'lucide-react';
import { Customer } from '@40labs/types';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Input } from '../forms/Input';

export interface QuickCustomerData {
  full_name: string;
  phone: string;
}

export interface CustomerPickerProps {
  value?: Customer | null;
  onChange: (customer: Customer | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowWalkIn?: boolean;
  allowCreate?: boolean;
  searchFields?: ('name' | 'phone' | 'id')[];
  onCreateCustomer?: (data: QuickCustomerData) => void;
  onWalkIn?: () => void;
  loading?: boolean;
  error?: string;
  customers?: Customer[]; // To allow passing mock customers in the lab
}

export function CustomerPicker({
  value,
  onChange,
  placeholder = 'Search customer...',
  disabled,
  allowWalkIn = true,
  allowCreate = true,
  searchFields = ['name', 'phone'],
  onCreateCustomer,
  onWalkIn,
  loading,
  error,
  customers = [],
}: CustomerPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredCustomers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return customers.filter((c) => {
      const nameMatch = searchFields.includes('name') && c.full_name.toLowerCase().includes(q);
      const phoneMatch = searchFields.includes('phone') && c.phone.toLowerCase().includes(q);
      const idMatch = searchFields.includes('id') && c.id.toString().toLowerCase().includes(q);
      return nameMatch || phoneMatch || idMatch;
    });
  }, [customers, query, searchFields]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    onChange(customer);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  const handleWalkIn = () => {
    if (onWalkIn) onWalkIn();
    onChange(null);
    setIsOpen(false);
    setQuery('');
  };

  const handleCreate = () => {
    if (onCreateCustomer) {
      // Basic heuristic: if it looks like a phone number, it's the phone, else name
      const isPhone = /^[0-9+\s-]{5,}$/.test(query);
      onCreateCustomer({
        full_name: isPhone ? '' : query,
        phone: isPhone ? query : '',
      });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {value ? (
        <div className={[
          "flex items-center justify-between p-2.5 rounded-input bg-primary/5 border border-primary/20 transition-all",
          disabled ? "opacity-50 grayscale" : "hover:border-primary/40"
        ].join(' ')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-surface shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text truncate leading-tight">{value.full_name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] font-mono text-text-muted">{value.phone}</p>
                 {value.outstanding_balance > 0 && (
                   <span className="text-[9px] font-bold text-danger bg-danger/10 px-1 rounded">
                     TZS {value.outstanding_balance.toLocaleString()}
                   </span>
                 )}
              </div>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={handleClear}
              className="p-1.5 text-text-muted hover:text-text hover:bg-panel rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
            error={!!error}
            autoComplete="off"
            prefix={<Search size={16} className="text-text-muted" />}
            suffix={
              loading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              )
            }
          />
          {error && (
            <div className="mt-1 flex items-center gap-1.5 text-danger">
              <AlertCircle size={12} />
              <span className="text-[10px] font-medium">{error}</span>
            </div>
          )}
        </div>
      )}

      {isOpen && !value && (
        <Card className="absolute z-50 w-full mt-1.5 max-h-[320px] overflow-hidden elevation-pop border border-border/40 bg-panel-strong shadow-2xl flex flex-col">
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full text-left p-2.5 rounded-input hover:bg-panel transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">{c.full_name}</p>
                    <p className="text-[10px] font-mono text-text-muted">{c.phone}</p>
                  </div>
                  {c.outstanding_balance > 0 && (
                    <div className="text-right">
                      <p className="text-[8px] text-text-muted uppercase font-bold">Balance</p>
                      <p className="text-tiny font-mono text-danger font-bold">TZS {c.outstanding_balance.toLocaleString()}</p>
                    </div>
                  )}
                </button>
              ))
            ) : query.trim() ? (
              <div className="py-6 px-4 text-center">
                <div className="w-10 h-10 bg-panel rounded-full flex items-center justify-center mx-auto mb-2 text-text-muted opacity-30">
                  <User size={20} />
                </div>
                <p className="text-xs text-text-muted italic">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="py-4 px-3 text-center text-xs text-text-muted italic">
                Start typing to search...
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border/30 bg-panel/50 flex flex-col gap-1.5">
            {allowWalkIn && (!query.trim() || filteredCustomers.length === 0) && (
              <Button
                size="sm"
                intent="neutral"
                fullWidth
                onClick={handleWalkIn}
                leftIcon={<User size={14} />}
                className="!justify-start !text-[11px] !h-8"
              >
                Continue as Walk-in
              </Button>
            )}
            {allowCreate && query.trim() && (
              <Button
                size="sm"
                intent="primary"
                fullWidth
                onClick={handleCreate}
                leftIcon={<UserPlus size={14} />}
                className="!justify-start !text-[11px] !h-8"
              >
                Create "{query}" as New Customer
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
