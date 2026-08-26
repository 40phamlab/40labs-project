// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/sales-pos.md]

import { useState, useMemo } from 'react';
import { Input, Card } from '@40labs/ui-components';
import { useInventoryList } from '../inventory/useInventory';
import { useSaleCart } from './useSales';
import { SaleCartTable } from './SaleCartTable';
import { SaleSummaryPanel } from './SaleSummaryPanel';

/**
 * Main Point of Sale (POS) component.
 * Integrates inventory lookup, cart management, and checkout.
 */
export default function SalesPOS() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: inventory, isLoading } = useInventoryList();
  const { addLine } = useSaleCart();

  // Filter inventory based on search term
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

  // Mock sync status per GOTCHAS.md #3
  // In a real app, this would be derived from the sync engine state.
  const isSynced = true;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header Area / Sync Status */}
      <header className="px-6 py-3 border-b border-black/5 flex justify-between items-center bg-surface/10">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-lg font-bold text-black/80">Sales / POS</h1>
          <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-white/50 border border-black/5">
             <div
               className={`w-2 h-2 rounded-full ${isSynced ? 'bg-primary' : 'bg-accent'}`}
               title={isSynced ? 'Synced with Central' : 'Sync Pending'}
             />
             <span className="text-[10px] font-ui uppercase tracking-wider text-black/40 font-medium">
               {isSynced ? 'Synced' : 'Syncing...'}
             </span>
          </div>
        </div>
        <div className="text-xs font-ui text-black/30">
          Terminal: Main-01 | Register Active
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel: Item Selection */}
        <aside className="w-72 flex flex-col border-r border-black/5 bg-surface/20">
          <div className="p-4 border-b border-black/5">
            <Input
              placeholder="Search medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {isLoading ? (
              <div className="text-center py-8 text-black/40 font-ui text-sm italic">
                Loading inventory...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-black/40 font-ui text-sm">
                No items found
              </div>
            ) : (
              filteredInventory.map((item) => (
                <Card
                  key={item.id}
                  interactive
                  className="flex flex-col gap-1 !p-3 group"
                  onClick={() => addLine(item.id, 1)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-ui font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                      {item.medicine.name}
                    </span>
                    <span className="font-mono text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-black/50">
                      {item.quantity} {item.medicine.unit}s
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-[10px] font-mono text-black/40">
                      Batch: {item.batch_number}
                    </span>
                    <span className="font-mono text-sm font-bold text-black/70">
                      {item.sell_price.toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </aside>

        {/* Center Panel: Active Cart */}
        <main className="flex-1 flex flex-col p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-ui font-bold text-black/60 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Active Cart
            </h2>
            <div className="h-px flex-1 bg-black/5 mx-4" />
          </div>

          <SaleCartTable />
        </main>

        {/* Right Panel: Checkout Summary */}
        <SaleSummaryPanel />

      </div>
    </div>
  );
}
