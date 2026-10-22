// [PHASE MVP — Medicine Product Image Slot]
// [SPEC: CONTEXT/SPEC/inventory.md]

import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  IconButton,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  EmptyState,
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
import { MedicineAvatar } from './MedicineAvatar';
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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize) || 1;

  const columns: ColumnDefinition<MedicineWithInventory>[] = [
    {
      key: 'name',
      header: 'Product Name',
      width: '260px',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        return (
          <div className="flex items-center gap-3 h-[56px]" title={item.medicine.name}>
            <MedicineAvatar
              id={item.medicine.id}
              name={item.medicine.name}
              category={item.medicine.category}
              imagePath={item.medicine.image_path}
            />
            <div className="flex flex-col justify-center truncate max-w-[200px]">
              <span className={`font-semibold truncate ${isExpired ? 'text-danger font-bold' : 'text-text-primary'}`}>
                {item.medicine.name}
              </span>
              {item.medicine.generic_name && (
                <span className="text-[11px] text-text-muted truncate">
                  {item.medicine.generic_name}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center text-xs text-text-secondary whitespace-nowrap">
          {item.medicine.category}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Stock Status',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center whitespace-nowrap">
          <StockIndicator
            quantity={item.quantity}
            lowStockThreshold={item.low_stock_threshold}
          />
        </div>
      ),
    },
    {
      key: 'buy_price',
      header: 'Buy Price',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center font-mono text-xs whitespace-nowrap">
          {item.buy_price.toLocaleString()} TZS
        </div>
      ),
    },
    {
      key: 'sell_price',
      header: 'Sell Price',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center font-mono text-xs whitespace-nowrap">
          {item.sell_price.toLocaleString()} TZS
        </div>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      className: 'whitespace-nowrap',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        const dateStr = item.expiry_date.slice(0, 10);
        return (
          <div className="h-[56px] flex items-center whitespace-nowrap">
            {isExpired ? (
              <StatusBadge status="error" label={dateStr} />
            ) : (
              <span className="text-xs font-mono">{dateStr}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'batch_number',
      header: 'Batch No.',
      accessorKey: 'batch_number',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center font-mono text-xs whitespace-nowrap">
          {item.batch_number}
        </div>
      ),
    },
    {
      key: 'metric',
      header: 'Unit',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center whitespace-nowrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {item.medicine.unit}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="h-[56px] flex items-center gap-2 justify-end whitespace-nowrap">
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
      data={paginatedData}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyState={<EmptyState variant="filtered" />}
      keyExtractor={(item) => item.id}
      density="compact"
      pagination={{
        currentPage,
        totalPages,
        pageSize,
        totalItems: data.length,
        pageSizeOptions: [25, 50, 100],
        onPageChange: setCurrentPage,
        onPageSizeChange: (sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        },
      }}
    />
  );
};
