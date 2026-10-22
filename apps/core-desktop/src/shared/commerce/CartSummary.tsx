import * as React from 'react';
import { Button, Input, Select, MoneyDisplay } from '@40labs/ui-components';
import { PauseCircle, Trash2, Send } from 'lucide-react';
import { t } from '@40labs/i18n';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'credit';

export interface CartSummaryProps {
  subtotal: number;
  discount?: number;
  onDiscountChange?: (n: number) => void;
  tax?: number;
  grandTotal: number;
  paymentMethod?: PaymentMethod | string;
  onPaymentMethodChange?: (m: any) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onHold?: () => void;
  disabled: boolean;
  isProcessing?: boolean;
  mode: 'sale' | 'purchase';
  ctaLabel?: string;
  deliveryNote?: string;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount = 0,
  onDiscountChange,
  tax = 0,
  grandTotal,
  paymentMethod = 'cash',
  onPaymentMethodChange,
  onConfirm,
  onDelete,
  onHold,
  disabled,
  isProcessing = false,
  mode,
  ctaLabel,
  deliveryNote,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 900);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const defaultCtaLabel = mode === 'sale' ? t('sales.confirm') || 'Confirm Transaction' : 'Send Order (WhatsApp)';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-2 p-3 bg-surface-secondary rounded-[12px] border border-border/50 elevation-inset min-w-0 ${className}`}
    >
      {/* Row 1: Subtotal | Discount / Delivery | Payment Method (if sale) */}
      <div className={`grid ${mode === 'sale' ? 'grid-cols-3' : 'grid-cols-2'} gap-3 items-end min-w-0`}>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
            Subtotal
          </span>
          <MoneyDisplay amount={subtotal} emphasis="strong" className="text-sm text-text" />
        </div>

        {mode === 'sale' && onDiscountChange ? (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Discount (TZS)
            </span>
            <Input
              type="number"
              monospace
              min={0}
              max={subtotal}
              value={discount || ''}
              placeholder="0"
              onChange={(e) => onDiscountChange(Math.max(0, Number(e.target.value) || 0))}
              className="!h-8 !text-xs"
            />
          </div>
        ) : (
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Delivery
            </span>
            <span className="text-xs font-medium text-text">{deliveryNote || 'Calculated on dispatch'}</span>
          </div>
        )}

        {mode === 'sale' && onPaymentMethodChange && (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Payment Method
            </span>
            <Select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="!h-8 !text-xs"
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
            </Select>
          </div>
        )}
      </div>

      {/* Row 2: Tax & Grand Total ········ [Clear] [Hold] [Confirm] */}
      <div
        className={[
          'pt-2 border-t border-border/30 flex min-w-0 items-center',
          isNarrow ? 'flex-col gap-3 items-stretch' : 'justify-between',
        ].join(' ')}
      >
        <div className="flex items-center gap-6 flex-1 min-w-0">
          {mode === 'sale' && (
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
                Tax
              </span>
              <MoneyDisplay amount={tax} emphasis="normal" className="text-xs text-text-muted" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Grand Total
            </span>
            <MoneyDisplay
              amount={grandTotal}
              emphasis="strong"
              className="text-xl text-primary font-mono font-bold truncate"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button
            type="button"
            intent="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled || isProcessing}
            leftIcon={<Trash2 size={14} />}
            className="text-text-muted hover:text-danger hover:bg-danger/10 rounded-[8px] px-4"
          >
            {mode === 'sale' ? t('sales.clear') : 'Clear Cart'}
          </Button>

          {onHold && (
            <Button
              type="button"
              intent="neutral"
              size="sm"
              onClick={onHold}
              disabled={disabled || isProcessing}
              leftIcon={<PauseCircle size={14} />}
              className="rounded-[8px] px-4"
            >
              {t('sales.hold')}
            </Button>
          )}

          <Button
            type="button"
            intent="primary"
            size="md"
            loading={isProcessing}
            disabled={disabled || isProcessing}
            onClick={onConfirm}
            leftIcon={mode === 'purchase' ? <Send size={16} /> : undefined}
            className={mode === 'sale' ? 'bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[8px] px-4' : 'rounded-[8px] px-4'}
          >
            {ctaLabel || defaultCtaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
