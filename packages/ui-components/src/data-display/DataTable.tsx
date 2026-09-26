import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableHeader,
  TableDensity,
  TableCellAlign,
} from './Table';
import { EmptyState, LoadingState, ErrorState, SkeletonTable } from './States';

export type ColumnAlign = TableCellAlign;

export type ColumnKey<T> = keyof T | (string & Record<never, never>);

export interface ColumnDefinition<T> {
  /** Unique key or row property name for the column */
  key: ColumnKey<T>;
  /** Explicit property key of T to access value if key is custom */
  accessorKey?: keyof T;
  /** Header title or custom node */
  header: React.ReactNode;
  /** Custom render function for the cell */
  render?: (item: T, index: number) => React.ReactNode;
  /** Custom value getter for rendering/sorting */
  valueGetter?: (item: T) => React.ReactNode;
  /** Enable column sorting indicator and toggle */
  sortable?: boolean;
  /** Additional CSS class for body cells */
  className?: string;
  /** Additional CSS class for header cell */
  headerClassName?: string;
  /** Column width specifier (e.g. '120px', '25%') */
  width?: string | number;
  /** Cell alignment */
  align?: ColumnAlign;
}

export interface TablePaginationConfig {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface TablePaginationProps extends TablePaginationConfig {
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  const startItem = pageSize && totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <div
      className={`
        flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-panel-strong border-t border-border text-xs
        ${className}
      `}
    >
      <div className="flex items-center gap-4 text-text-muted">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-text">{startItem}</strong>–
            <strong className="text-text">{endItem}</strong> of{' '}
            <strong className="text-text">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-text">{currentPage}</strong> of{' '}
            <strong className="text-text">{Math.max(1, totalPages)}</strong>
          </span>
        )}

        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-panel border border-border rounded-input px-2 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 rounded-input bg-panel text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed border border-border text-xs transition-colors"
        >
          Prev
        </button>
        <span className="px-2 text-text-muted font-mono text-xs">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 rounded-input bg-panel text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed border border-border text-xs transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export interface DataTableProps<T> {
  /** Row dataset */
  data: T[];
  /** Column definitions typed against row model T */
  columns: ColumnDefinition<T>[];
  /** Loading flag or custom loading component */
  loading?: boolean;
  loadingMessage?: string;
  loadingState?: React.ReactNode;
  /** Error flag/object/message or custom error component */
  error?: string | Error | boolean | null;
  errorTitle?: string;
  errorMessage?: string;
  errorState?: React.ReactNode;
  onRetry?: () => void;
  /** Empty state message or custom empty state component */
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  /** Density level ('compact' | 'normal' | 'spacious') */
  density?: TableDensity;
  /** Backwards compatible alias for density="compact" */
  dense?: boolean;
  /** Row click event handler */
  onRowClick?: (item: T, index: number) => void;
  /** Selected row identifiers */
  selectedIds?: Set<string | number> | Array<string | number>;
  /** Callback when single row selection checkbox changes */
  onSelectRow?: (item: T) => void;
  /** Callback when select all checkbox changes */
  onSelectAll?: (selected: boolean) => void;
  /** Custom function to determine if a row is selected */
  isRowSelected?: (item: T) => boolean;
  /** Batch actions component rendered when rows are selected */
  batchActions?: React.ReactNode;
  /** Currently active sort column key */
  sortKey?: string;
  /** Active sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Sort change handler */
  onSort?: (key: string) => void;
  /** Key extractor function for row items */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Enable hover styling on rows (default true) */
  hoverable?: boolean;
  /** Pagination configuration */
  pagination?: TablePaginationConfig;
  /** Additional container CSS class */
  className?: string;
}

function defaultKeyExtractor<T>(item: T, index: number): string | number {
  if (typeof item === 'object' && item !== null) {
    if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
      return item.id;
    }
    if ('key' in item && (typeof item.key === 'string' || typeof item.key === 'number')) {
      return item.key;
    }
  }
  return index;
}

function renderCellValue<T>(item: T, column: ColumnDefinition<T>, index: number): React.ReactNode {
  if (column.render) {
    return column.render(item, index);
  }
  if (column.valueGetter) {
    return column.valueGetter(item);
  }
  const keyToAccess = column.accessorKey ?? (column.key as keyof T);
  if (typeof item === 'object' && item !== null && keyToAccess in item) {
    const val = item[keyToAccess];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (React.isValidElement(val)) return val;
    return String(val);
  }
  return null;
}

function checkItemSelected<T>(
  item: T,
  index: number,
  keyExtractor: (item: T, index: number) => string | number,
  selectedIds?: Set<string | number> | Array<string | number>,
  isRowSelected?: (item: T) => boolean
): boolean {
  if (isRowSelected) {
    return isRowSelected(item);
  }
  if (!selectedIds) {
    return false;
  }
  const id = keyExtractor(item, index);
  if (selectedIds instanceof Set) {
    return selectedIds.has(id);
  }
  if (Array.isArray(selectedIds)) {
    return selectedIds.includes(id);
  }
  return false;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  loadingMessage,
  loadingState,
  error,
  errorTitle,
  errorMessage,
  errorState,
  onRetry,
  emptyMessage = 'No data available',
  emptyState,
  density = 'normal',
  dense,
  onRowClick,
  selectedIds,
  onSelectRow,
  onSelectAll,
  isRowSelected,
  batchActions,
  sortKey,
  sortDirection,
  onSort,
  keyExtractor = defaultKeyExtractor,
  hoverable = true,
  pagination,
  className = '',
}: DataTableProps<T>) {
  const actualDensity = dense ? 'compact' : density;

  // Handle Error State
  if (error) {
    if (errorState) return <>{errorState}</>;
    const resolvedMessage =
      errorMessage ||
      (typeof error === 'string'
        ? error
        : error instanceof Error
        ? error.message
        : 'An unexpected error occurred while loading data.');
    return <ErrorState title={errorTitle} message={resolvedMessage} onRetry={onRetry} />;
  }

  // Handle Loading State
  if (loading) {
    if (loadingState) return <>{loadingState}</>;
    if (loadingMessage) return <LoadingState message={loadingMessage} />;
    return <SkeletonTable rows={5} columns={columns.length} density={actualDensity} />;
  }

  // Handle Empty State
  if (!data.length) {
    if (emptyState) return <>{emptyState}</>;
    return <EmptyState message={emptyMessage} />;
  }

  // Selection state calculation
  const selectedCount = data.filter((item, idx) =>
    checkItemSelected(item, idx, keyExtractor, selectedIds, isRowSelected)
  ).length;

  const allSelected = data.length > 0 && selectedCount === data.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < data.length;

  return (
    <div className={`w-full flex flex-col rounded-card border border-border bg-surface-strong overflow-hidden ${className}`}>
      {/* Batch Action Bar */}
      {batchActions && selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20 text-xs text-primary font-medium">
          <span>{selectedCount} row(s) selected</span>
          <div className="flex items-center gap-2">{batchActions}</div>
        </div>
      )}

      {/* Main Table */}
      <div className="w-full overflow-x-auto overflow-y-visible">
        <Table density={actualDensity} bordered={false}>
          <TableHeader sticky>
            <TableRow hoverable={false}>
              {(onSelectRow || onSelectAll) && (
                <TableCell isHeader density={actualDensity} className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded-input bg-panel border-border accent-primary cursor-pointer"
                    aria-label="Select all rows"
                  />
                </TableCell>
              )}

              {columns.map((col) => {
                const isSortActive = sortKey === String(col.key);
                const colAlign = col.align || 'left';

                if (col.sortable && onSort) {
                  return (
                    <SortableHeader
                      key={String(col.key)}
                      sortDirection={isSortActive ? sortDirection : null}
                      active={isSortActive}
                      align={colAlign}
                      density={actualDensity}
                      className={col.headerClassName || col.className}
                      style={col.width ? { width: col.width } : undefined}
                      onSort={() => onSort(String(col.key))}
                    >
                      {col.header}
                    </SortableHeader>
                  );
                }

                return (
                  <TableCell
                    key={String(col.key)}
                    isHeader
                    align={colAlign}
                    density={actualDensity}
                    className={col.headerClassName || col.className}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((item, index) => {
              const rowId = keyExtractor(item, index);
              const isSelected = checkItemSelected(item, index, keyExtractor, selectedIds, isRowSelected);

              return (
                <TableRow
                  key={rowId}
                  selected={isSelected}
                  hoverable={hoverable}
                  clickable={!!onRowClick}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {(onSelectRow || onSelectAll) && (
                    <TableCell density={actualDensity} className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectRow?.(item);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-input bg-panel border-border accent-primary cursor-pointer"
                        aria-label={`Select row ${rowId}`}
                      />
                    </TableCell>
                  )}

                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      align={col.align || 'left'}
                      density={actualDensity}
                      className={col.className}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {renderCellValue(item, col, index)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {pagination && <TablePagination {...pagination} />}
    </div>
  );
}
