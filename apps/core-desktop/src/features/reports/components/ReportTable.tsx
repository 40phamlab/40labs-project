import * as React from 'react';
import { DataTable, ColumnDefinition, EmptyState } from '@40labs/ui-components';
import { TableColumn } from '../config/reportCategories';

export interface ReportTableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  isLoading?: boolean;
  className?: string;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  columns,
  rows,
  isLoading = false,
  className = '',
}) => {
  const formattedColumns = React.useMemo<ColumnDefinition<Record<string, unknown>>[]>(() => {
    return columns.map((col) => ({
      key: col.key,
      header: col.header,
      align: col.align || 'left',
      render: (row) => {
        const val = row[col.key];
        if (col.format) {
          return col.format(val, row);
        }
        if (val === null || val === undefined) return '—';
        return String(val);
      },
    }));
  }, [columns]);

  if (!columns || columns.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      <DataTable
        data={rows}
        columns={formattedColumns}
        loading={isLoading}
        density="compact"
        emptyState={<EmptyState variant="empty" />}
      />
    </div>
  );
};
