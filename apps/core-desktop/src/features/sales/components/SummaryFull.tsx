import * as React from 'react';
import { Button, Input, Select, MoneyDisplay } from '@40labs/ui-components';
import { PauseCircle, Trash2 } from 'lucide-react';
import { t } from '@40labs/i18n';
import type { PaymentMethod } from './SalesSummaryBar';

export interface SummaryFullProps {
  subtotal: number;
  discount: number;
  onDiscountChange: (n: number) => void;
  tax: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onHold?: () => void;
  disabled: boolean;
  isProcessing?: boolean;
}

export const SummaryFull: React.FC<SummaryFullProps> = ({
  subtotal,
  discount,
  onDiscountChange,
  tax,
  grandTotal,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onDelete,
  onHold,
  disabled,
  isProcessing = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 1100);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-2 min-w-0 pr-8">
      {/* Row 1: Subtotal | Discount | Payment Method */}
      <div className="grid grid-cols-3 gap-3 items-end min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
            Subtotal
          </span>
          <MoneyDisplay amount={subtotal} emphasis="strong" className="text-sm text-text" />
        </div>

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

        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
            Payment Method
          </span>
          <Select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
            className="!h-8 !text-xs"
          >
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </Select>
        </div>
      </div>

      {/* Row 2: Tax & Grand Total (left) ········ [Clear] [Hold] [Confirm] (right) */}
      <div
        className={[
          'pt-2 border-t border-border/30 flex min-w-0 items-center',
          isNarrow ? 'flex-col gap-3 items-stretch' : 'justify-between',
        ].join(' ')}
      >
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Tax
            </span>
            <MoneyDisplay amount={tax} emphasis="normal" className="text-xs text-text-muted" />
          </div>

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
            {t('sales.clear')}
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
            title="Ctrl+Enter"
            className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[8px] px-4"
          >
            {t('sales.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
