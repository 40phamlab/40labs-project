import * as React from 'react';
import { Button, Input, Select } from '@40labs/ui-components';

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
  disabled: boolean;
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
  disabled,
}) => {
  return (
    <div className="grid grid-rows-2 gap-4 p-5 bg-surface-strong rounded-card border border-border/50 elevation-inset">
      {/* Row 1 (3-col grid) */}
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
            Line Total
          </span>
          <span className="text-sm font-mono font-bold">
            TZS {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
            Discount
          </span>
          {/* TODO: [PIN gate] discount threshold TBD */}
          <Input
            type="number"
            monospace
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
            Payment
          </span>
          <Select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
          >
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </Select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Tax
            </span>
            <span className="text-sm font-mono font-bold">
              TZS {tax.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Grand Total
            </span>
            <span className="text-xl font-mono font-bold text-primary">
              TZS {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            intent="accent"
            onClick={onDelete}
            disabled={disabled}
            className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest shadow-surface-pop hover:shadow-none"
          >
            Delete
          </Button>
          <Button
            intent="primary"
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest shadow-surface-pop hover:shadow-none"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
