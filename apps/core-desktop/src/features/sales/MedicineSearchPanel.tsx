import * as React from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { SearchInput, IconButton, ProductRow } from '@40labs/ui-components';
import { MedicineWithInventory } from '@40labs/types';
import { salesApi } from '../../api';

export interface MedicineSearchPanelProps {
  medicines: MedicineWithInventory[];
  onAdd: (medicine: MedicineWithInventory) => void;
  onToggleCollapse?: () => void;
}

export const MedicineSearchPanel: React.FC<MedicineSearchPanelProps> = ({
  medicines,
  onAdd,
  onToggleCollapse,
}) => {
  const [query, setQuery] = React.useState('');
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Compute frequency ranking from salesApi
  const rankedMedicines = React.useMemo(() => {
    const frequencyMap: Record<string, number> = {};
    const salesList = salesApi.list();

    salesList.forEach((sale) => {
      if (sale.lines) {
        sale.lines.forEach((line) => {
          if (line.medicine_id) {
            frequencyMap[line.medicine_id] = (frequencyMap[line.medicine_id] || 0) + line.quantity;
          }
        });
      }
    });

    return [...medicines].sort((a, b) => {
      const countA = frequencyMap[a.medicine_id] || 0;
      const countB = frequencyMap[b.medicine_id] || 0;

      if (countB !== countA) {
        return countB - countA; // Descending by sale frequency
      }

      return a.medicine.name.localeCompare(b.medicine.name);
    });
  }, [medicines, refreshTrigger]);

  // Filter list by query text if non-empty
  const filteredMedicines = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rankedMedicines;

    return rankedMedicines.filter((m) => {
      const nameMatch = m.medicine.name.toLowerCase().includes(normalized);
      const genericMatch = m.medicine.generic_name?.toLowerCase().includes(normalized);
      return nameMatch || genericMatch;
    });
  }, [rankedMedicines, query]);

  const handleRefresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-panel-strong border border-border/50 rounded-card p-4 elevation-inset h-full overflow-hidden w-[300px]">
      {/* Header Row */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">
            Medicines Store
          </h2>
          <IconButton
            icon={<RefreshCw size={12} />}
            label="Refresh rankings"
            intent="ghost"
            size="sm"
            onClick={handleRefresh}
          />
        </div>
        {onToggleCollapse && (
          <IconButton
            icon={<ChevronRight size={16} />}
            label="Hide panel"
            intent="ghost"
            size="sm"
            onClick={onToggleCollapse}
          />
        )}
      </div>

      {/* Search Input */}
      <div className="shrink-0">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicine..."
          className="!h-10 w-full"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
        {filteredMedicines.length === 0 ? (
          <div className="text-center text-xs text-text-muted italic py-8">
            No matching medicines found.
          </div>
        ) : (
          filteredMedicines.map((item) => {
            const stockLabel = `${item.quantity} ${item.medicine.unit || 'units'}`;
            const priceLabel = `TZS ${item.sell_price.toLocaleString()}`;

            return (
              <ProductRow
                key={item.id}
                name={item.medicine.name}
                sku={item.medicine.generic_name ?? undefined}
                stock={stockLabel}
                price={priceLabel}
                onAdd={() => onAdd(item)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
