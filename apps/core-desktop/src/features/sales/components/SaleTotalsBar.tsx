import * as React from 'react';
import { Button, Input, Select, MoneyDisplay, HotkeyBadge } from '@40labs/ui-components';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'credit';

export interface SaleTotalsBarProps {
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

export const SaleTotalsBar: React.FC<SaleTotalsBarProps> = ({
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
  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-strong rounded-card border border-border/50 elevation-inset">
      {/* Top Controls Row */}
      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
            Subtotal
          </span>
          <MoneyDisplay amount={subtotal} emphasis="strong" className="text-sm text-text" />
        </div>

        <div className="flex flex-col gap-1">
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

        <div className="flex flex-col gap-1">
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

      {/* Bottom Totals & Action Buttons Row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Tax
            </span>
            <MoneyDisplay amount={tax} emphasis="normal" className="text-xs text-text-muted" />
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
              Grand Total
            </span>
            <MoneyDisplay amount={grandTotal} emphasis="strong" className="text-xl text-primary font-mono font-bold" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onHold && (
            <Button
              type="button"
              intent="neutral"
              size="sm"
              onClick={onHold}
              disabled={disabled || isProcessing}
            >
              Hold Bill
            </Button>
          )}

          <Button
            type="button"
            intent="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled || isProcessing}
            className="text-text-muted hover:text-danger hover:bg-danger/10"
          >
            Clear Cart
          </Button>

          <Button
            type="button"
            intent="primary"
            size="md"
            loading={isProcessing}
            disabled={disabled || isProcessing}
            onClick={onConfirm}
            rightIcon={
              <HotkeyBadge className="!bg-black/20 !text-surface !border-white/10 !text-[8px] !px-1">
                Ctrl+Enter
              </HotkeyBadge>
            }
          >
            Confirm Sale
          </Button>
        </div>
      </div>
    </div>
  );
};
