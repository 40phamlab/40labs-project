import * as React from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  return (
    <nav className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span
            onClick={item.onClick}
            className={`cursor-pointer transition-colors ${
              item.active ? 'text-text' : 'text-text-muted hover:text-text'
            }`}
          >
            {item.label}
          </span>
          {index < items.length - 1 && <span className="mx-2 text-border">/</span>}
        </React.Fragment>
      ))}
    </nav>
  );
};
