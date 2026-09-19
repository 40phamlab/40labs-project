import * as React from 'react';
import { Button, Select } from '@40labs/ui-components';

export interface SaleTotalsBarProps {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  onConfirm: () => void;
  onDelete: () => void;
  disabled: boolean;
}

export const SaleTotalsBar: React.FC<SaleTotalsBarProps> = ({
  subtotal,
  discount,
  tax,
  grandTotal,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onDelete,
  disabled,
}) => {
  return (
    <div className="flex items-center justify-between gap-6 p-4 bg-panel/50 rounded-card border border-border/50 shadow-sm">
      <div className="flex gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-60">
            Subtotal
          </span>
          <span className="text-sm font-mono font-bold">
            TZS {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-60">
            Discount
          </span>
          <span className="text-sm font-mono font-bold text-danger">
            - TZS {discount.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-60">
            Grand Total
          </span>
          <span className="text-lg font-mono font-bold text-primary">
            TZS {grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            value={paymentMethod}
            onChange={onPaymentMethodChange}
            options={[
              { label: 'Cash', value: 'cash' },
              { label: 'Mobile Money', value: 'mobile_money' },
              { label: 'Card', value: 'card' },
            ]}
          />
        </div>

        <div className="flex gap-2">
          <Button
            intent="neutral"
            variant="ghost"
            onClick={onDelete}
            disabled={disabled && subtotal === 0}
          >
            Clear
          </Button>
          <Button
            intent="primary"
            onClick={onConfirm}
            disabled={disabled || subtotal === 0}
          >
            Complete Sale
          </Button>
        </div>
      </div>
    </div>
  );
};
