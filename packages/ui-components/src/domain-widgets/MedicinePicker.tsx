import * as React from 'react';
import { Pill, AlertCircle, Calendar, Package } from 'lucide-react';
import { Medicine, InventoryItem } from '@40labs/types';
import { Badge } from '../primitives/Badge';
import { Combobox, ComboboxOption } from '../forms/Combobox';

export interface MedicineWithInventory extends Medicine {
  inventory?: InventoryItem;
}

export interface MedicinePickerProps {
  value?: MedicineWithInventory | null;
  onChange: (medicine: MedicineWithInventory | null) => void;
  placeholder?: string;
  disabled?: boolean;
  requireAvailableStock?: boolean;
  searchFields?: ('name' | 'genericName' | 'sku' | 'barcode')[];
  showStock?: boolean;
  showPrice?: boolean;
  showBatch?: boolean;
  showExpiry?: boolean;
  loading?: boolean;
  error?: string;
  medicines?: MedicineWithInventory[];
}

interface MedicineOption extends ComboboxOption {
  medicine: MedicineWithInventory;
}

export function MedicinePicker({
  value,
  onChange,
  placeholder = 'Search medicine...',
  disabled,
  requireAvailableStock = false,
  searchFields = ['name', 'genericName'],
  showStock = true,
  showPrice = true,
  showBatch = false,
  showExpiry = false,
  loading,
  error,
  medicines = [],
}: MedicinePickerProps) {
  const options: MedicineOption[] = React.useMemo(() => {
    return medicines
      .filter((m) => {
        if (requireAvailableStock && (!m.inventory || m.inventory.quantity <= 0)) {
          return false;
        }
        return true;
      })
      .map((m) => ({
        label: m.name,
        value: m.id,
        medicine: m,
      }));
  }, [medicines, requireAvailableStock]);

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

  const renderMedicineOption = (option: ComboboxOption) => {
    const medOption = option as MedicineOption;
    const m = medOption.medicine;
    const qty = m.inventory?.quantity ?? 0;
    const price = m.inventory?.sell_price ?? 0;
    const batch = m.inventory?.batch_number;
    const expiry = m.inventory?.expiry_date;
    const threshold = m.inventory?.low_stock_threshold ?? 10;

    const stockVariant = getStockVariant(qty, threshold);
    const expiring = isExpiringSoon(expiry);

    return (
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-panel-strong text-text-muted shrink-0">
            <Pill size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-tight">
              {m.name}
            </p>
            {m.generic_name && (
              <p className="text-[10px] text-text-muted truncate italic">
                {m.generic_name}
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
    );
  };

  return (
    <div className="w-full space-y-1">
      <div className="relative">
        <Combobox
          placeholder={placeholder}
          value={value?.id || ''}
          onChange={(val) => {
            const selected = medicines.find((m) => m.id === val);
            onChange(selected || null);
          }}
          disabled={disabled}
          error={error}
          options={options}
          renderOption={renderMedicineOption}
        />
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
