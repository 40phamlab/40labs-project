import * as React from 'react';

export interface ColumnDefinition<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  emptyMessage?: string;
  dense?: boolean;
  onRowClick?: (item: T) => void;
  selectedIds?: Set<string | number>;
  onSelectRow?: (item: T) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (key: string) => void;
  keyExtractor?: (item: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyMessage = 'No data available',
  dense,
  onRowClick,
  selectedIds,
  onSelectRow,
  sortKey,
  sortDirection,
  onSort,
  keyExtractor = (item: any) => item.id || item.key,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-strong rounded-card border border-border">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Loading data...</span>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-strong rounded-card border border-border border-dashed">
        <h3 className="text-sm font-bold text-text mb-1">No data found</h3>
        <p className="text-xs text-text-muted max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border bg-surface-strong">
      <table className="w-full text-left border-collapse">
        <thead className="bg-panel-strong border-b border-border">
          <tr>
            {onSelectRow && (
              <th className="w-10 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <input type="checkbox" className="rounded-input bg-panel border-border" />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`
                  px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted
                  ${col.sortable && onSort ? 'cursor-pointer hover:text-text transition-colors select-none' : ''}
                  ${col.className || ''}
                `}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && onSort && (
                    <span className="text-[10px] w-3">
                      {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, index) => {
            const id = keyExtractor(item);
            const isSelected = selectedIds?.has(id);

            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(item)}
                className={`
                  transition-colors
                  ${isSelected ? 'bg-primary/5' : 'hover:bg-panel/50'}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {onSelectRow && (
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow(item);
                      }}
                      className="rounded-input bg-panel border-border"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-4 text-xs text-text
                      ${dense ? 'py-2' : 'py-3'}
                      ${col.className || ''}
                    `}
                  >
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
