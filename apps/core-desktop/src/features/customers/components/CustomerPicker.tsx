import * as React from 'react';
import { X } from 'lucide-react';
import { Customer } from '@40labs/types';
import { Card, Input, IconButton } from '@40labs/ui-components';

export interface CustomerPickerProps {
  value: Customer | null;
  manualEntry: { full_name: string; phone: string };
  onSelectCustomer: (c: Customer | null) => void;
  onManualEntryChange: (data: { full_name: string; phone: string }) => void;
  customers: Customer[];
}

export function CustomerPicker({
  value,
  manualEntry,
  onSelectCustomer,
  onManualEntryChange,
  customers = [],
}: CustomerPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredCustomers = React.useMemo(() => {
    const q = manualEntry.full_name.trim().toLowerCase();
    if (!q) return [];

    return customers.filter((c) => {
      const nameMatch = c.full_name.toLowerCase().includes(q);
      const phoneMatch = c.phone.toLowerCase().includes(q);
      return nameMatch || phoneMatch;
    });
  }, [customers, manualEntry.full_name]);

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
    onSelectCustomer(customer);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
  };

  const isReadOnly = !!value;

  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-4">
      <div className="relative flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
          Customer's Name
        </label>
        <div className="relative w-full">
          <Input
            placeholder="Enter customer name..."
            value={value ? value.full_name : manualEntry.full_name}
            onChange={(e) => {
              if (!isReadOnly) {
                onManualEntryChange({ ...manualEntry, full_name: e.target.value });
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (!isReadOnly) {
                setIsOpen(true);
              }
            }}
            readOnly={isReadOnly}
            autoComplete="off"
            suffix={
              value && (
                <IconButton
                  icon={<X size={14} />}
                  label="Clear selected customer"
                  intent="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="mr-1"
                />
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
          Customer's Phone/Email
        </label>
        <Input
          placeholder="Enter phone or email..."
          value={value ? value.phone : manualEntry.phone}
          onChange={(e) => {
            if (!isReadOnly) {
              onManualEntryChange({ ...manualEntry, phone: e.target.value });
            }
          }}
          readOnly={isReadOnly}
          autoComplete="off"
        />
      </div>

      {isOpen && !value && manualEntry.full_name.trim().length > 0 && (
        <Card className="absolute left-0 right-0 top-[68px] z-50 max-h-[240px] overflow-hidden elevation-pop border border-border/40 bg-panel-strong shadow-surface-pop flex flex-col">
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full text-left p-2.5 rounded-input hover:bg-panel transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                      {c.full_name}
                    </p>
                    <p className="text-[10px] font-mono text-text-muted">{c.phone}</p>
                  </div>
                  {c.outstanding_balance > 0 && (
                    <div className="text-right">
                      <p className="text-[8px] text-text-muted uppercase font-bold">Balance</p>
                      <p className="text-tiny font-mono text-danger font-bold">
                        TZS {c.outstanding_balance.toLocaleString()}
                      </p>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="py-4 px-3 text-center text-xs text-text-muted italic">
                No matching registered customers found.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
