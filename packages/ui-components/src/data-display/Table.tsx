import * as React from 'react';

export type TableDensity = 'compact' | 'normal' | 'spacious';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
  dense?: boolean;
  striped?: boolean;
  bordered?: boolean;
  fullWidth?: boolean;
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  className = '',
  containerClassName = '',
  density = 'normal',
  dense,
  striped = false,
  bordered = true,
  fullWidth = true,
  children,
  ...props
}) => {
  const actualDensity = dense ? 'compact' : density;

  return (
    <div
      className={`
        w-full overflow-x-auto rounded-card bg-surface-primary transition-all duration-150 custom-scrollbar
        ${bordered ? 'border border-border-default' : ''}
        ${containerClassName}
      `}
    >
      <table
        className={`
          border-collapse text-left
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        data-density={actualDensity}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  className = '',
  sticky = false,
  ...props
}) => {
  return (
    <thead
      className={`
        bg-surface-secondary border-b border-border-default
        ${sticky ? 'sticky top-0 z-10 bg-surface-secondary' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean;
}

export const TableBody: React.FC<TableBodyProps> = ({ className = '', striped, ...props }) => {
  return (
    <tbody
      className={`
        divide-y divide-border-subtle
        ${striped ? '[&>tr:nth-child(even)]:bg-surface-secondary/40' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  disabled?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  className = '',
  selected = false,
  clickable = false,
  hoverable = true,
  disabled = false,
  ...props
}) => {
  return (
    <tr
      className={`
        transition-colors duration-150
        ${selected ? 'bg-surface-selected border-l-2 border-action-primary' : hoverable && !disabled ? 'hover:bg-surface-hover/50' : ''}
        ${clickable && !disabled ? 'cursor-pointer select-none' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
      aria-selected={selected}
      {...props}
    />
  );
};

export type TableCellAlign = 'left' | 'center' | 'right';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
  density?: TableDensity;
  dense?: boolean;
  align?: TableCellAlign;
  truncate?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  className = '',
  isHeader = false,
  density = 'normal',
  dense,
  align = 'left',
  truncate = false,
  children,
  ...props
}) => {
  const Component = isHeader ? 'th' : 'td';
  const actualDensity = dense ? 'compact' : density;

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const paddingClass = {
    compact: 'px-2.5 py-1.5',
    normal: 'px-3.5 py-2.5',
    spacious: 'px-5 py-3.5',
  }[actualDensity];

  const baseClasses = isHeader
    ? 'text-[10px] font-bold uppercase tracking-wider text-text-muted whitespace-nowrap select-none'
    : 'text-xs text-text-primary';

  return (
    <Component
      className={`
        ${baseClasses}
        ${paddingClass}
        ${alignClass}
        ${truncate ? 'truncate max-w-[220px]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface SortableHeaderProps extends TableCellProps {
  sortDirection?: 'asc' | 'desc' | null;
  active?: boolean;
  onSort?: () => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  children,
  sortDirection = null,
  active = false,
  onSort,
  className = '',
  align = 'left',
  ...props
}) => {
  const justifyClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];

  return (
    <TableCell
      isHeader
      align={align}
      className={`
        cursor-pointer hover:text-text-primary transition-colors select-none group
        ${active ? 'text-action-primary font-bold' : ''}
        ${className}
      `}
      onClick={onSort}
      {...props}
    >
      <div className={`flex items-center gap-1.5 ${justifyClass}`}>
        <span>{children}</span>
        <span
          className={`
            text-[10px] w-3 h-3 flex items-center justify-center transition-transform duration-150
            ${active ? 'text-action-primary opacity-100 font-bold' : 'text-text-muted opacity-40 group-hover:opacity-100'}
          `}
        >
          {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
        </span>
      </div>
    </TableCell>
  );
};
