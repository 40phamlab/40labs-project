import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  IconButton,
  Button,
  DropdownMenu,
  DropdownMenuItem,
} from '@40labs/ui-components';
import {
  MoreVertical,
  PlusCircle,
  SlidersHorizontal,
  AlertTriangle,
  CalendarX2,
  Trash2,
  ArrowRightLeft,
  Archive,
} from 'lucide-react';
import { type MedicineWithInventory } from '@40labs/types';
import { StockIndicator } from './StockIndicator';
import type { StockActionType } from '../../../hooks/useInventory';

interface InventoryTableProps {
  data: MedicineWithInventory[];
  onAction: (item: MedicineWithInventory, action: StockActionType) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

const RowActions = ({
  item,
  onAction,
}: {
  item: MedicineWithInventory;
  onAction: (item: MedicineWithInventory, action: StockActionType) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          icon={<MoreVertical size={14} />}
          label="Inventory Actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <DropdownMenuItem
        label="Refill Stock"
        icon={<PlusCircle size={14} />}
        onClick={() => {
          onAction(item, 'refill');
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Stock Adjustment"
        icon={<SlidersHorizontal size={14} />}
        onClick={() => {
          onAction(item, 'adjustment');
          setIsOpen(false);
        }}
      />
      <div className="h-px bg-border/20 my-1 mx-1" />
      <DropdownMenuItem
        label="Mark Damaged"
        icon={<AlertTriangle size={14} />}
        onClick={() => {
          onAction(item, 'damaged');
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Mark Expired"
        icon={<CalendarX2 size={14} />}
        onClick={() => {
          onAction(item, 'expired');
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Dispose Stock"
        icon={<Trash2 size={14} />}
        onClick={() => {
          onAction(item, 'disposed');
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Transfer Stock"
        icon={<ArrowRightLeft size={14} />}
        onClick={() => {
          onAction(item, 'transferred');
          setIsOpen(false);
        }}
      />
      <div className="h-px bg-border/20 my-1 mx-1" />
      <DropdownMenuItem
        label="Deactivate Batch"
        icon={<Archive size={14} />}
        variant="danger"
        onClick={() => {
          onAction(item, 'deactivated');
          setIsOpen(false);
        }}
      />
    </DropdownMenu>
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  data,
  onAction,
  loading,
  error,
  onRetry,
}) => {
  const columns: ColumnDefinition<MedicineWithInventory>[] = [
    {
      key: 'name',
      header: 'Product Name',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`font-semibold ${isExpired ? 'text-danger font-bold' : 'text-text-primary'}`}>
              {item.medicine.name}
            </span>
            {item.medicine.generic_name && (
              <span className="text-[11px] text-text-muted">
                {item.medicine.generic_name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="text-xs text-text-secondary">
          {item.medicine.category}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Stock Status',
      render: (item) => (
        <StockIndicator
          quantity={item.quantity}
          lowStockThreshold={item.low_stock_threshold}
        />
      ),
    },
    {
      key: 'buy_price',
      header: 'Buy Price',
      className: 'font-mono text-xs',
      render: (item) => `${item.buy_price.toLocaleString()} TZS`,
    },
    {
      key: 'sell_price',
      header: 'Sell Price',
      className: 'font-mono text-xs',
      render: (item) => `${item.sell_price.toLocaleString()} TZS`,
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        const dateStr = item.expiry_date.slice(0, 10);
        return isExpired ? (
          <StatusBadge status="error" label={dateStr} />
        ) : (
          <span className="text-xs font-mono">{dateStr}</span>
        );
      },
    },
    {
      key: 'batch_number',
      header: 'Batch No.',
      accessorKey: 'batch_number',
      className: 'font-mono text-xs',
    },
    {
      key: 'metric',
      header: 'Unit',
      render: (item) => (
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {item.medicine.unit}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => onAction(item, 'refill')}
          >
            Re-fill
          </Button>
          <RowActions item={item} onAction={onAction} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage="No inventory items found matching your criteria."
      keyExtractor={(item) => item.id}
      density="compact"
    />
  );
};
