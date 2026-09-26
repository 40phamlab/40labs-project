import * as React from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { SearchInput, IconButton } from '@40labs/ui-components';
import { ProductRow } from './ProductRow';
import { MedicineWithInventory, Sale } from '@40labs/types';

export interface MedicineSearchPanelProps {
  medicines: MedicineWithInventory[];
  completedSales?: Sale[];
  onAdd: (medicine: MedicineWithInventory) => void;
  onToggleCollapse?: () => void;
}

export const MedicineSearchPanel: React.FC<MedicineSearchPanelProps> = ({
  medicines,
  completedSales = [],
  onAdd,
  onToggleCollapse,
}) => {
  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Derive categories from available medicines
  const categories = React.useMemo(() => {
    return Array.from(new Set(medicines.map((m) => m.medicine.category))).filter(Boolean) as string[];
  }, [medicines]);

  // Compute frequency ranking from completedSales
  const rankedMedicines = React.useMemo(() => {
    const frequencyMap: Record<string, number> = {};

    completedSales.forEach((sale) => {
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
  }, [medicines, completedSales, refreshTrigger]);

  // Filter list by category and search query
  const filteredMedicines = React.useMemo(() => {
    let result = rankedMedicines;

    if (selectedCategory) {
      result = result.filter((m) => m.medicine.category === selectedCategory);
    }

    const normalized = query.trim().toLowerCase();
    if (!normalized) return result;

    return result.filter((m) => {
      const nameMatch = m.medicine.name.toLowerCase().includes(normalized);
      const genericMatch = m.medicine.generic_name?.toLowerCase().includes(normalized);
      return nameMatch || genericMatch;
    });
  }, [rankedMedicines, selectedCategory, query]);

  const handleRefresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col gap-3 bg-panel-strong border border-border/50 rounded-card p-4 elevation-inset h-full overflow-hidden w-[320px] shrink-0">
      {/* Header Row */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
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
          placeholder="Search medicine (Press /)..."
          className="!h-9 w-full"
        />
      </div>

      {/* Quick Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={[
              'text-[10px] font-bold px-2 py-1 rounded-full shrink-0 border transition-colors',
              selectedCategory === null
                ? 'bg-primary text-surface border-primary'
                : 'bg-panel text-text-muted hover:text-text border-border/20',
            ].join(' ')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={[
                'text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border transition-colors',
                selectedCategory === cat
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-panel text-text-muted hover:text-text border-border/20',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
        {filteredMedicines.length === 0 ? (
          <div className="text-center text-xs text-text-muted italic py-8 border border-dashed border-border/20 rounded-card">
            No matching medicines found.
          </div>
        ) : (
          filteredMedicines.map((item) => (
            <ProductRow
              key={item.id}
              name={item.medicine.name}
              sku={item.medicine.generic_name ?? undefined}
              stock={item.quantity}
              price={item.sell_price}
              onAdd={() => onAdd(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};
