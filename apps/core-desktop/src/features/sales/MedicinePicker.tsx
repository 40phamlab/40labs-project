import * as React from 'react';
import { Pill, AlertCircle, Calendar, Package } from 'lucide-react';
import { MedicineWithInventory } from '@40labs/types';
import { Badge, Input, Card, IconButton } from '@40labs/ui-components';

export interface MedicinePickerProps {
  value?: MedicineWithInventory | null;
  onChange: (medicine: MedicineWithInventory | null) => void;
  placeholder?: string;
  disabled?: boolean;
  requireAvailableStock?: boolean;
  _searchFields?: ('name' | 'genericName' | 'sku' | 'barcode')[];
  showStock?: boolean;
  showPrice?: boolean;
  showBatch?: boolean;
  showExpiry?: boolean;
  loading?: boolean;
  error?: string;
  medicines?: MedicineWithInventory[];
}

export function MedicinePicker({
  value,
  onChange,
  placeholder = 'Search medicine...',
  disabled,
  requireAvailableStock = false,
  showStock = true,
  showPrice = true,
  showBatch = false,
  showExpiry = false,
  loading,
  error,
  medicines = [],
}: MedicinePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMedicines = React.useMemo(() => {
    return medicines
      .filter((m) => {
        if (requireAvailableStock && m.quantity <= 0) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          m.medicine.name.toLowerCase().includes(q) ||
          (m.medicine.generic_name && m.medicine.generic_name.toLowerCase().includes(q))
        );
      });
  }, [medicines, requireAvailableStock, query]);

  const selectedMedicine = medicines.find((m) => m.id === value?.id);
  const displayValue = selectedMedicine ? selectedMedicine.medicine.name : '';

  const getStockVariant = (quantity: number, threshold: number = 10) => {
    if (quantity <= 0) return 'danger';
    if (quantity <= threshold) return 'warning';
    return 'success';
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  };

  return (
    <div className="w-full space-y-1" ref={containerRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          disabled={disabled}
          error={error}
          autoComplete="off"
          suffix={
            <div className="flex items-center">
              <IconButton
                type="button"
                intent="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                icon={<span>{isOpen ? '▲' : '▼'}</span>}
                label="Toggle dropdown"
                className="!w-6 !h-6"
                disabled={disabled}
              />
            </div>
          }
        />

        {isOpen && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border border-border/20 bg-panel-strong shadow-2xl">
            {filteredMedicines.length > 0 ? (
              <ul className="py-1">
                {filteredMedicines.map((m) => {
                  const qty = m.quantity;
                  const price = m.sell_price;
                  const batch = m.batch_number;
                  const expiry = m.expiry_date;
                  const threshold = m.low_stock_threshold;
                  const stockVariant = getStockVariant(qty, threshold);
                  const expiring = isExpiringSoon(expiry);

                  return (
                    <li
                      key={m.id}
                      onClick={() => {
                        onChange(m);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={[
                        'px-3 py-2 text-sm cursor-pointer transition-colors',
                        m.id === value?.id ? 'bg-primary text-surface font-medium' : 'text-text hover:bg-panel'
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded bg-panel-strong text-text-muted shrink-0">
                            <Pill size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">
                              {m.medicine.name}
                            </p>
                            {m.medicine.generic_name && (
                              <p className="text-[10px] text-text-muted truncate italic">
                                {m.medicine.generic_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {showExpiry && expiry && (
                            <Badge
                              variant={expiring ? 'danger' : 'neutral'}
                              className="!text-[8px] !px-1.5 !py-0 flex items-center gap-1"
                            >
                              <Calendar size={8} />
                              {new Date(expiry).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            </Badge>
                          )}

                          {showBatch && batch && (
                            <div className="flex items-center gap-0.5 text-[9px] font-mono text-text-muted">
                              <Package size={8} />
                              {batch}
                            </div>
                          )}

                          {showStock && (
                            <Badge
                              variant={stockVariant}
                              className="!text-[9px] !px-1.5 !py-0 min-w-[32px] text-center"
                            >
                              {qty}
                            </Badge>
                          )}

                          {showPrice && (
                            <span className="text-[11px] font-mono font-bold text-primary">
                              {price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-4 text-xs text-text-muted text-center italic">No results found</div>
            )}
          </Card>
        )}

        {loading && (
          <div className="absolute right-10 top-2.5">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && !loading && (
        <div className="flex items-center gap-1.5 text-danger px-1">
          <AlertCircle size={12} />
          <span className="text-[10px] font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
