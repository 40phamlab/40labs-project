import * as React from 'react';
import { Minus, Plus, X, Search, User, Trash2, CheckCircle2, Clock, AlertCircle, CreditCard, Wallet, Banknote, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Input } from '../forms/Input';
import { SearchInput } from '../forms/SearchInput';

export interface PriceDisplayProps {
  amount: number | string;
  currency?: string;
  originalAmount?: number | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriceDisplay = ({
  amount,
  currency = 'TZS',
  originalAmount,
  size = 'md',
  className = '',
}: PriceDisplayProps) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-end ${className}`}>
      {originalAmount && (
        <span className="text-tiny text-text-muted line-through opacity-60 font-mono">
          {currency} {originalAmount}
        </span>
      )}
      <span className={`${sizeClasses[size]} font-bold text-primary font-mono`}>
        {currency} {amount}
      </span>
    </div>
  );
};

export interface DiscountDisplayProps {
  label?: string;
  amount?: number | string;
  percentage?: number;
  className?: string;
}

export const DiscountDisplay = ({
  label = 'Discount',
  amount,
  percentage,
  className = '',
}: DiscountDisplayProps) => {
  return (
    <div className={`flex items-center gap-1.5 text-tiny font-semibold text-danger ${className}`}>
      <Badge variant="danger" className="!px-1 !py-0 !text-[9px]">
        {percentage ? `-${percentage}%` : 'OFF'}
      </Badge>
      <span>{label}</span>
      {amount && <span className="font-mono">(-{amount})</span>}
    </div>
  );
};

export interface QuantityControlProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const QuantityControl = ({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max,
  size = 'md',
  className = '',
}: QuantityControlProps) => {
  const isAtMin = value <= min;
  const isAtMax = max !== undefined && value >= max;

  return (
    <div className={`flex items-center bg-panel-strong rounded-full p-0.5 elevation-inset ${className}`}>
      <button
        onClick={onDecrement}
        disabled={isAtMin}
        className={`
          flex items-center justify-center rounded-full transition-colors
          ${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'}
          ${isAtMin ? 'text-text-muted opacity-30' : 'text-text hover:bg-panel'}
        `}
      >
        <Minus size={size === 'sm' ? 12 : 14} />
      </button>
      <span className={`font-mono font-bold text-text text-center ${size === 'sm' ? 'min-w-[20px] text-xs' : 'min-w-[32px] text-sm'}`}>
        {value}
      </span>
      <button
        onClick={onIncrement}
        disabled={isAtMax}
        className={`
          flex items-center justify-center rounded-full transition-colors
          ${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'}
          ${isAtMax ? 'text-text-muted opacity-30' : 'text-primary hover:bg-panel'}
        `}
      >
        <Plus size={size === 'sm' ? 12 : 14} />
      </button>
    </div>
  );
};

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

export interface ProductRowProps {
  name: string;
  sku?: string;
  stock: number | string;
  price: number | string;
  onAdd?: () => void;
  className?: string;
}

export const ProductRow = ({
  name,
  sku,
  stock,
  price,
  onAdd,
  className = '',
}: ProductRowProps) => {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-input bg-panel hover:bg-panel-strong transition-colors border border-border/10 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text truncate">{name}</p>
        {sku && <p className="text-tiny font-mono text-text-muted uppercase tracking-tighter">{sku}</p>}
      </div>
      <div className="text-right">
        <p className="text-tiny text-text-muted uppercase tracking-widest text-[8px]">Stock</p>
        <p className="text-xs font-mono text-text">{stock}</p>
      </div>
      <div className="text-right min-w-[80px]">
        <p className="text-tiny text-text-muted uppercase tracking-widest text-[8px]">Price</p>
        <p className="text-xs font-mono font-bold text-primary">{price}</p>
      </div>
      {onAdd && (
        <Button size="sm" intent="primary" className="!p-1 !h-7 !w-7 !min-w-0" onClick={onAdd}>
          <Plus size={14} />
        </Button>
      )}
    </div>
  );
};

export interface ProductResultProps {
  name: string;
  subtitle?: string;
  price?: string | number;
  highlight?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ProductResult = ({
  name,
  subtitle,
  price,
  highlight,
  onClick,
  className = '',
}: ProductResultProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between p-2 rounded-input text-left transition-colors
        ${highlight ? 'bg-primary text-surface' : 'bg-panel-strong text-text hover:bg-panel'}
        ${className}
      `}
    >
      <div className="min-w-0">
        <p className={`text-xs font-semibold truncate ${highlight ? 'text-surface' : 'text-text'}`}>
          {name}
        </p>
        {subtitle && (
          <p className={`text-tiny truncate ${highlight ? 'text-surface/70' : 'text-text-muted'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {price && (
        <span className={`text-xs font-mono font-bold ${highlight ? 'text-surface' : 'text-primary'}`}>
          {price}
        </span>
      )}
    </button>
  );
};

export interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  results?: React.ReactNode;
  className?: string;
}

export const ProductSearch = ({
  value,
  onChange,
  placeholder = 'Search products...',
  isLoading,
  results,
  className = '',
}: ProductSearchProps) => {
  return (
    <div className={`relative flex flex-col gap-1 ${className}`}>
      <SearchInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="!h-10"
      />
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {results && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-panel border border-border rounded-card shadow-2xl p-1 space-y-1 max-h-60 overflow-y-auto elevation-raised">
          {results}
        </div>
      )}
    </div>
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
    <div className={`flex items-center gap-2 rounded-card bg-panel-strong p-2 elevation-raised border border-border/10 ${className}`}>
      <div className="w-10 h-10 shrink-0 rounded-input bg-field elevation-inset overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-field flex items-center justify-center text-text-muted/30">
            <ImageIcon size={16} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-text">{name}</p>
        <p className="text-[10px] text-text-muted font-mono">
          @{unitPrice}
        </p>
      </div>
      <QuantityControl
        value={quantity}
        onIncrement={onIncrement || (() => {})}
        onDecrement={onDecrement || (() => {})}
        size="sm"
      />
      <div className="w-20 text-right">
        <span className="font-mono text-xs font-bold text-primary">{subtotal}</span>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export interface CartSummaryProps {
  subtotal: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  onCheckout?: () => void;
  isCheckoutDisabled?: boolean;
  className?: string;
}

export const CartSummary = ({
  subtotal,
  tax,
  discount,
  total,
  onCheckout,
  isCheckoutDisabled,
  className = '',
}: CartSummaryProps) => {
  return (
    <div className={`space-y-3 p-3 bg-panel-strong rounded-card border border-border/20 ${className}`}>
      <div className="space-y-1">
        <div className="flex justify-between text-tiny text-text-muted">
          <span>Subtotal</span>
          <span className="font-mono">{subtotal}</span>
        </div>
        {discount !== undefined && (
          <div className="flex justify-between text-tiny text-danger">
            <span>Discount</span>
            <span className="font-mono">-{discount}</span>
          </div>
        )}
        {tax !== undefined && (
          <div className="flex justify-between text-tiny text-text-muted">
            <span>Tax (18%)</span>
            <span className="font-mono">{tax}</span>
          </div>
        )}
      </div>
      <div className="pt-2 border-t border-border flex justify-between items-baseline">
        <span className="text-xs font-bold text-text uppercase tracking-widest">Total</span>
        <span className="text-lg font-bold text-primary font-mono">{total}</span>
      </div>
      {onCheckout && (
        <Button
          intent="primary"
          fullWidth
          size="lg"
          onClick={onCheckout}
          disabled={isCheckoutDisabled}
          className="mt-2"
        >
          Complete Sale
        </Button>
      )}
    </div>
  );
};

export interface CartProps {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export const Cart = ({ children, emptyState, className = '' }: CartProps) => {
  const isEmpty = React.Children.count(children) === 0;

  return (
    <div className={`flex flex-col h-full bg-panel rounded-card overflow-hidden border border-border/10 ${className}`}>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isEmpty ? (
          emptyState || (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 space-y-2 py-8">
              <ShoppingCart size={32} strokeWidth={1} />
              <p className="text-xs italic">Cart is empty</p>
            </div>
          )
        ) : (
          children
        )}
      </div>
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
    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-70">{label}</p>
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
    <div className={`flex flex-col rounded-card bg-field text-text-on-field p-3 elevation-inset ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3">{title}</p>
      <div className="space-y-3">
        {children}
      </div>
      {footer && <div className="mt-4 pt-3 border-t border-black/5">{footer}</div>}
    </div>
  );
};

export interface CustomerBase {
  id: string | number;
  full_name: string;
  phone: string;
  email?: string | null;
  outstanding_balance?: number;
  loyalty_points?: number;
}

export interface CustomerSelectorProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelect: (customer: CustomerBase) => void;
  onCreateNew?: () => void;
  onWalkIn?: () => void;
  results?: CustomerBase[];
  isLoading?: boolean;
  selectedCustomer?: CustomerBase | null;
  onClearSelection?: () => void;
  className?: string;
}

export const CustomerSelector = ({
  searchQuery,
  onSearchChange,
  onSelect,
  onCreateNew,
  onWalkIn,
  results = [],
  isLoading,
  selectedCustomer,
  onClearSelection,
  className = '',
}: CustomerSelectorProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {!selectedCustomer ? (
        <div className="space-y-2">
          <div className="relative">
            <SearchInput
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search customer (Name/Phone)..."
              className="!h-9"
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchQuery.trim().length > 0 && results.length > 0 && (
            <div className="bg-panel-strong border border-border/20 rounded-card p-1 space-y-1 elevation-raised">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full text-left p-2 rounded-input hover:bg-panel transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{c.full_name}</p>
                    <p className="text-tiny font-mono text-text-muted">{c.phone}</p>
                  </div>
                  <User size={14} className="text-text-muted opacity-30" />
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim().length > 0 && results.length === 0 && !isLoading && (
            <div className="p-3 bg-panel-strong/50 border border-dashed border-border/20 rounded-card text-center">
              <p className="text-xs text-text-muted mb-2">No customer found</p>
              {onCreateNew && (
                <Button size="sm" intent="primary" fullWidth onClick={onCreateNew}>
                  Create "{searchQuery}"
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {onWalkIn && (
              <Button size="sm" intent="neutral" fullWidth onClick={onWalkIn}>
                Walk-in Customer
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-card">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-surface shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-text truncate">{selectedCustomer.full_name}</p>
              <p className="text-tiny font-mono text-text-muted">{selectedCustomer.phone}</p>
            </div>
          </div>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="p-1 text-text-muted hover:text-text hover:bg-panel rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export interface CustomerSummaryProps {
  customer: CustomerBase | null;
  isWalkIn?: boolean;
  className?: string;
}

export const CustomerSummary = ({ customer, isWalkIn, className = '' }: CustomerSummaryProps) => {
  return (
    <EntitySummaryPanel title="Customer Information" className={className}>
      {customer ? (
        <>
          <InfoDetail label="Full Name" value={customer.full_name} />
          <InfoDetail label="Phone" value={customer.phone} monospace />
          {customer.email && <InfoDetail label="Email" value={customer.email} />}
          {customer.outstanding_balance !== undefined && (
            <InfoDetail
              label="Outstanding Balance"
              value={`TZS ${customer.outstanding_balance.toLocaleString()}`}
              monospace
              className="text-danger"
            />
          )}
          {customer.loyalty_points !== undefined && (
            <InfoDetail label="Loyalty Points" value={customer.loyalty_points} monospace />
          )}
        </>
      ) : isWalkIn ? (
        <div className="py-4 flex flex-col items-center justify-center text-text-muted opacity-50 space-y-2">
          <User size={24} strokeWidth={1} />
          <p className="text-xs italic uppercase tracking-widest">Walk-in Customer</p>
        </div>
      ) : (
        <p className="text-xs text-text-muted italic py-4">No customer selected</p>
      )}
    </EntitySummaryPanel>
  );
};

export interface OrderStatusProps {
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'processing';
  className?: string;
}

export const OrderStatus = ({ status, className = '' }: OrderStatusProps) => {
  const configs = {
    pending: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
    completed: { variant: 'success' as const, icon: CheckCircle2, label: 'Completed' },
    cancelled: { variant: 'danger' as const, icon: X, label: 'Cancelled' },
    refunded: { variant: 'neutral' as const, icon: AlertCircle, label: 'Refunded' },
    processing: { variant: 'info' as const, icon: Clock, label: 'Processing' },
  };

  const { variant, icon: Icon, label } = configs[status];

  return (
    <Badge variant={variant} className={`flex items-center gap-1 !px-2 !py-0.5 ${className}`}>
      <Icon size={12} />
      <span className="uppercase tracking-tighter font-bold text-[10px]">{label}</span>
    </Badge>
  );
};

export interface OrderSummaryProps {
  orderNumber: string;
  date: string;
  status: OrderStatusProps['status'];
  itemCount: number;
  total: string | number;
  className?: string;
}

export const OrderSummary = ({
  orderNumber,
  date,
  status,
  itemCount,
  total,
  className = '',
}: OrderSummaryProps) => {
  return (
    <Card className={`p-4 bg-panel-strong border border-border/20 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Order Number</p>
          <p className="text-sm font-mono font-bold text-text">{orderNumber}</p>
        </div>
        <OrderStatus status={status} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InfoDetail label="Date" value={date} />
        <InfoDetail label="Items" value={itemCount} />
      </div>
      <div className="pt-4 border-t border-border flex justify-between items-baseline">
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Grand Total</span>
        <span className="text-xl font-bold text-primary font-mono">{total}</span>
      </div>
    </Card>
  );
};

export interface PaymentSummaryProps {
  payments: Array<{
    method: string;
    amount: string | number;
    date?: string;
    reference?: string;
  }>;
  totalPaid: string | number;
  remainingBalance?: string | number;
  className?: string;
}

export const PaymentSummary = ({
  payments,
  totalPaid,
  remainingBalance,
  className = '',
}: PaymentSummaryProps) => {
  return (
    <div className={`space-y-4 p-4 bg-field rounded-card elevation-inset ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-on-field opacity-60">Payment History</p>
      <div className="space-y-2">
        {payments.map((p, i) => (
          <div key={i} className="flex justify-between items-center bg-black/5 p-2 rounded-input border border-black/5">
            <div>
              <p className="text-xs font-semibold text-text-on-field">{p.method}</p>
              {p.reference && <p className="text-[9px] font-mono opacity-50">{p.reference}</p>}
            </div>
            <p className="text-xs font-mono font-bold text-text-on-field">{p.amount}</p>
          </div>
        ))}
      </div>
      <div className="pt-2 space-y-1">
        <div className="flex justify-between text-xs text-text-on-field">
          <span className="opacity-60">Total Paid</span>
          <span className="font-mono font-bold">{totalPaid}</span>
        </div>
        {remainingBalance !== undefined && (
          <div className="flex justify-between text-xs text-danger font-bold">
            <span>Remaining</span>
            <span className="font-mono">{remainingBalance}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export interface PaymentMethodSelectorProps {
  selectedMethod?: string;
  onSelect: (method: string) => void;
  className?: string;
}

export const PaymentMethodSelector = ({
  selectedMethod,
  onSelect,
  className = '',
}: PaymentMethodSelectorProps) => {
  const methods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'mobile', label: 'Mobile Money', icon: Wallet },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {methods.map((m) => {
        const Icon = m.icon;
        const isActive = selectedMethod === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-card transition-all gap-2
              ${isActive
                ? 'bg-primary text-surface elevation-raised scale-[1.02]'
                : 'bg-panel-strong text-text-muted hover:bg-panel border border-border/10'}
            `}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
