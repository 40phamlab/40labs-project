// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/inventory.md]
import React, { useState, useMemo } from 'react';
import { Card, Input, Button, KPITile } from '@40labs/ui-components';
import { useInventoryList, type InventoryItemWithMedicine } from './useInventory';

/**
 * InventoryList Component
 * Displays a searchable, filterable list of inventory items with
 * indicators for low stock and expired batches.
 */
export function InventoryList() {
  const { data: items = [], isLoading, error } = useInventoryList();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.medicine.category));
    return ['All', ...Array.from(cats)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.medicine.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.medicine.generic_name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.medicine.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.quantity <= i.low_stock_threshold).length;
  }, [items]);

  const expiredCount = useMemo(() => {
    const now = new Date();
    return items.filter((i) => new Date(i.expiry_date) < now).length;
  }, [items]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-black/50 font-ui">
        Loading inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center text-danger font-ui">
        Error loading inventory data.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl text-black/80">Inventory</h1>
          <p className="text-sm text-black/50 font-ui">Manage medicine stock and expiry</p>
        </div>
        <Button onClick={() => alert('Add Item Form not built yet')}>Add Item</Button>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPITile label="Total SKUs" value={items.length} />
        <KPITile label="Low Stock" value={lowStockCount} tone="accent" />
        <KPITile label="Expired" value={expiredCount} tone="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-surface p-4 rounded-card elevation-raised">
        <div className="flex-1 w-full">
          <Input
            label="Search Medicines"
            placeholder="Search by name or generic name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1 w-full md:w-64">
          <label className="font-ui text-sm text-black/70">Category</label>
          <select
            className="rounded-input px-3 py-2 bg-surface elevation-inset font-ui focus:outline-none focus:ring-2 focus:ring-primary/40 h-[42px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory List */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => (
          <InventoryRow key={item.id} item={item} />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-surface rounded-card elevation-raised">
            <p className="text-black/40 font-ui">No medicines match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * InventoryRow Component
 * Renders a single inventory item as a Card.
 */
function InventoryRow({ item }: { item: InventoryItemWithMedicine }) {
  const isExpired = new Date(item.expiry_date) < new Date();
  const isLowStock = item.quantity <= item.low_stock_threshold;

  return (
    <Card
      className={[
        'transition-all duration-200',
        isExpired ? 'border-l-4 border-l-danger bg-danger/5' : '',
      ].join(' ')}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3
              className={[
                'font-ui font-semibold text-lg',
                isExpired ? 'text-danger' : 'text-black/80',
              ].join(' ')}
            >
              {item.medicine.name}
            </h3>
            {isLowStock && (
              <span className="bg-accent/10 text-accent text-[10px] uppercase font-bold px-2 py-0.5 rounded ring-1 ring-accent/20">
                Low Stock
              </span>
            )}
            {isExpired && (
              <span className="bg-danger/10 text-danger text-[10px] uppercase font-bold px-2 py-0.5 rounded ring-1 ring-danger/20">
                Expired
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/50 font-ui">
            <span>
              Category: <span className="text-black/70 font-medium">{item.medicine.category}</span>
            </span>
            <span>
              Batch: <span className="font-mono text-black/70">{item.batch_number}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-12 md:text-right border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 border-black/5">
          <div>
            <p className="text-[10px] uppercase text-black/40 font-ui mb-1 tracking-wider">Expiry</p>
            <p className={['text-sm font-mono', isExpired ? 'text-danger font-bold' : 'text-black/70'].join(' ')}>
              {item.expiry_date.slice(0, 10)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-black/40 font-ui mb-1 tracking-wider">Quantity</p>
            <p className="text-sm font-mono text-black/70">
              {item.quantity} <span className="text-[10px] font-ui">{item.medicine.unit}s</span>
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase text-black/40 font-ui mb-1 tracking-wider">Sell Price</p>
            <p className="text-sm font-mono font-bold text-primary">
              TZS {item.sell_price.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
