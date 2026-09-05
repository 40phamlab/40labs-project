import * as React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  dense?: boolean;
}

export const Table = ({ className = '', dense, ...props }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-border bg-surface-strong">
      <table className={`w-full text-left border-collapse ${className}`} {...props} />
    </div>
  );
};

export const TableHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return <thead className={`bg-panel-strong border-b border-border ${className}`} {...props} />;
};

export const TableBody = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return <tbody className={`divide-y divide-border ${className}`} {...props} />;
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export const TableRow = ({ className = '', selected, clickable, ...props }: TableRowProps) => {
  return (
    <tr
      className={`
        transition-colors
        ${selected ? 'bg-primary/5' : 'hover:bg-panel/50'}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
  dense?: boolean;
}

export const TableCell = ({
  className = '',
  isHeader,
  dense,
  children,
  ...props
}: TableCellProps) => {
  const Component = isHeader ? 'th' : 'td';
  const baseClasses = isHeader
    ? 'text-[10px] font-bold uppercase tracking-wider text-text-muted'
    : 'text-xs text-text';

  const paddingClasses = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <Component className={`${baseClasses} ${paddingClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export interface SortableHeaderProps extends TableCellProps {
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const SortableHeader = ({
  children,
  sortDirection,
  onSort,
  className = '',
  ...props
}: SortableHeaderProps) => {
  return (
    <TableCell
      isHeader
      className={`cursor-pointer hover:text-text transition-colors select-none ${className}`}
      onClick={onSort}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        <span className="text-[10px] w-3">
          {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
        </span>
      </div>
    </TableCell>
  );
};
