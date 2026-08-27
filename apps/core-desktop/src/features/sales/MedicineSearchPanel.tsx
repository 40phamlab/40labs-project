// [PHASE: MVP]
import { useState, useMemo } from 'react';
import { Input, Card } from '@40labs/ui-components';
import { useInventoryList } from '../inventory/useInventory';
import { useSaleCart } from './useSales';

/**
 * Medicine Search and Selection panel.
 * Relocated from SalesPOS.tsx to the right column in the new 3-column layout.
 */
export function MedicineSearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: inventory, isLoading } = useInventoryList();
  const { addLine } = useSaleCart();

  // Filter inventory based on search term (name, generic name, or batch)
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (!searchTerm.trim()) return inventory;

    const query = searchTerm.toLowerCase();
    return inventory.filter(
      (item) =>
        item.medicine.name.toLowerCase().includes(query) ||
        item.medicine.generic_name.toLowerCase().includes(query) ||
        item.batch_number.toLowerCase().includes(query)
    );
  }, [inventory, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-surface/20">
      {/* Search Header */}
      <div className="p-6 border-b border-black/5 bg-white">
        <h3 className="text-[10px] font-ui uppercase tracking-widest text-black/40 font-bold mb-4">
          Inventory Lookup
        </h3>
        <Input
          placeholder="Search medicine..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          autoComplete="off"
        />
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-12 text-black/20 font-ui text-sm italic">
            Loading inventory...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12 text-black/30 font-ui text-sm">
            No items found matching "{searchTerm}"
          </div>
        ) : (
          filteredInventory.map((item) => (
            <Card
              key={item.id}
              interactive
              className="flex flex-col gap-1 !p-4 group elevation-raised hover:elevation-hover"
              onClick={() => addLine(item.id, 1)}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-ui font-semibold text-sm leading-tight text-black/80 group-hover:text-primary transition-colors truncate">
                    {item.medicine.name}
                  </span>
                  <span className="text-[10px] font-ui text-black/30 italic truncate">
                    {item.medicine.generic_name}
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-black/5 px-2 py-0.5 rounded-full text-black/50 shrink-0">
                  {item.quantity} {item.medicine.unit}s
                </span>
              </div>

              <div className="flex justify-between items-end mt-2 pt-2 border-t border-black/5">
                <span className="text-[10px] font-mono text-black/40">
                  Batch: {item.batch_number}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-sm font-bold text-black/70">
                    {item.sell_price.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-mono text-black/30">TZS</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
