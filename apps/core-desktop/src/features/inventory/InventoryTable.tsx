import * as React from 'react';
import { DataTable, StatusBadge, type ColumnDefinition } from '@40labs/ui-components';
import { type MedicineWithInventory } from './InventoryScreen';

interface InventoryTableProps {
  data: MedicineWithInventory[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ data }) => {
  const columns: ColumnDefinition<MedicineWithInventory>[] = [
    {
      key: 'name',
      header: 'Product name',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        return (
          <span className={isExpired ? 'text-danger font-bold' : ''}>
            {item.medicine.name}
          </span>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => item.medicine.category,
    },
    {
      key: 'quantity',
      header: 'Quantity',
    },
    {
      key: 'buy_price',
      header: 'Buy price',
      className: 'font-mono',
      render: (item) => item.buy_price.toLocaleString(),
    },
    {
      key: 'sell_price',
      header: 'Sell price',
      className: 'font-mono',
      render: (item) => item.sell_price.toLocaleString(),
    },
    {
      key: 'expiry_date',
      header: 'Expire',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        const dateStr = item.expiry_date.slice(0, 10);
        return isExpired ? (
          <StatusBadge status="error" label={dateStr} />
        ) : (
          dateStr
        );
      },
    },
    {
      key: 'batch_number',
      header: 'batch',
      className: 'font-mono',
    },
    {
      key: 'metric',
      header: 'Metric',
      render: (item) => (
        <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">
          {item.medicine.unit}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      emptyMessage="No inventory items found matching your criteria."
      keyExtractor={(item) => item.id}
      dense
    />
  );
};
