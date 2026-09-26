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
  Info,
  Pencil,
  Bookmark,
  MessageCircle,
  Truck,
  Trash2,
} from 'lucide-react';
import { type MedicineWithInventory } from '@40labs/types';

interface InventoryTableProps {
  data: MedicineWithInventory[];
  onDelete: (id: string) => void;
}

const RowActions = ({
  item,
  onDelete,
}: {
  item: MedicineWithInventory;
  onDelete: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          icon={<MoreVertical size={14} />}
          label="Actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <DropdownMenuItem
        label="Info"
        icon={<Info size={14} />}
        onClick={() => {
          console.log('TODO: Info', item.id);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Edit"
        icon={<Pencil size={14} />}
        onClick={() => {
          console.log('TODO: Edit', item.id);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Mark"
        icon={<Bookmark size={14} />}
        onClick={() => {
          console.log('TODO: Mark', item.id);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Ask"
        icon={<MessageCircle size={14} />}
        onClick={() => {
          console.log('TODO: Ask', item.id);
          setIsOpen(false);
        }}
      />
      <div className="h-px bg-border-subtle my-1 mx-1" />
      <DropdownMenuItem
        label="Supplier"
        icon={<Truck size={14} />}
        onClick={() => {
          console.log('TODO: Supplier', item.id);
          setIsOpen(false);
        }}
      />
      <DropdownMenuItem
        label="Delete"
        icon={<Trash2 size={14} />}
        variant="danger"
        onClick={() => {
          onDelete(item.id);
          setIsOpen(false);
        }}
      />
    </DropdownMenu>
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  data,
  onDelete,
}) => {
  const columns: ColumnDefinition<MedicineWithInventory>[] = [
    {
      key: 'name',
      header: 'Product name',
      render: (item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        return (
          <span
            className={
              isExpired ? 'text-danger font-bold' : ''
            }
          >
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
        const isExpired =
          new Date(item.expiry_date) < new Date();
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
      key: 'supplier',
      header: 'Supplier',
      render: (item: any) => item.medicine.supplier_name ?? '—',
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
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (item) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => {
              console.log('TODO: Re-fill', item.id);
            }}
          >
            Re-fill
          </Button>
          <RowActions item={item} onDelete={onDelete} />
        </div>
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
