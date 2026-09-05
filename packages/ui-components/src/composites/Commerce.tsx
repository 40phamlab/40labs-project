import * as React from 'react';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';

export interface ProductCardProps {
  name: string;
  subtitle?: string;
  stock?: string | number;
  price?: string | number;
  info?: string;
  onClick?: () => void;
  className?: string;
}

export const ProductCard = ({
  name,
  subtitle,
  stock,
  price,
  info,
  onClick,
  className = '',
}: ProductCardProps) => {
  return (
    <Card interactive={!!onClick} onClick={onClick} className={`p-3 bg-panel-strong ${className}`}>
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-text">{name}</p>
          {subtitle && <p className="truncate text-tiny text-text-muted italic">{subtitle}</p>}
        </div>
        {stock !== undefined && (
          <span className="font-mono text-tiny text-text-muted">{stock}</span>
        )}
      </div>
      {(info || price !== undefined) && (
        <div className="mt-2 pt-2 border-t border-border flex justify-between items-end">
          {info && <span className="font-mono text-tiny text-text-muted">{info}</span>}
          {price !== undefined && (
            <span className="font-mono text-xs font-bold text-primary">{price}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export interface CartItemProps {
  name: string;
  unitPrice: string | number;
  quantity: number;
  subtotal: string | number;
  imageUrl?: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  className?: string;
}

export const CartItem = ({
  name,
  unitPrice,
  quantity,
  subtotal,
  imageUrl,
  onIncrement,
  onDecrement,
  onRemove,
  className = '',
}: CartItemProps) => {
  return (
    <div className={`flex items-center gap-2 rounded-card bg-panel-strong p-2 elevation-raised ${className}`}>
      <div className="w-12 h-12 shrink-0 rounded-input bg-field elevation-inset overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-field" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-text">{name}</p>
        <p className="text-caption text-text-muted">
          Unit <span className="font-mono">{unitPrice}</span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onDecrement}
          className="w-6 h-5 rounded-full bg-panel text-text elevation-raised text-xs flex items-center justify-center hover:bg-panel-strong transition-colors"
        >
          −
        </button>
        <span className="font-mono text-xs text-text">{quantity}</span>
        <button
          onClick={onIncrement}
          className="w-6 h-5 rounded-full bg-primary text-surface elevation-raised text-xs flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          +
        </button>
      </div>
      <span className="w-20 text-right font-mono text-xs text-primary">{subtotal}</span>
      {onRemove && (
        <Button
          intent="danger"
          size="sm"
          className="!p-1 !w-6 !h-6 !min-w-0 !rounded-full"
          onClick={onRemove}
        >
          ×
        </Button>
      )}
    </div>
  );
};

export interface InfoDetailProps {
  label: string;
  value: string | number;
  monospace?: boolean;
  className?: string;
}

export const InfoDetail = ({ label, value, monospace, className = '' }: InfoDetailProps) => (
  <div className={className}>
    <p className="text-caption text-text-muted uppercase tracking-wider">{label}</p>
    <p className={`text-xs ${monospace ? 'font-mono' : ''} text-text mt-0.5`}>{value}</p>
  </div>
);

export interface EntitySummaryPanelProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const EntitySummaryPanel = ({
  title,
  children,
  footer,
  className = '',
}: EntitySummaryPanelProps) => {
  return (
    <div className={`min-h-0 flex-1 flex flex-col rounded-card bg-field text-text-on-field p-3 overflow-hidden ${className}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">{title}</p>
      <div className="flex-1 overflow-y-auto space-y-4">
        {children}
      </div>
      {footer && <div className="mt-4 pt-4 border-t border-black/10">{footer}</div>}
    </div>
  );
};
