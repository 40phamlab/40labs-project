import * as React from 'react';
import { Button, Badge } from '@40labs/ui-components';
import { Smartphone } from 'lucide-react';

export interface SaleTotalsBarProps {
  lineTotal: number;
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
  lineTotal,
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
    <div className="flex flex-col gap-4 p-5 bg-panel-strong/40 rounded-card border border-border/50 shadow-surface-pop">
      <div className="flex items-end justify-between">
        {/* Summary Labels */}
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Line Total
            </span>
            <span className="text-sm font-mono font-bold">{lineTotal} Items</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Cart Totals
            </span>
            <span className="text-sm font-mono font-bold">
              TZS {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Discount
            </span>
            <span className="text-sm font-mono font-bold text-danger">
              - {discount.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Tax
            </span>
            <span className="text-sm font-mono font-bold">
              {tax.toLocaleString()}
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

          {/* M-pesa Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
              Payment
            </span>
            <button
              onClick={() => onPaymentMethodChange(paymentMethod === 'mobile_money' ? 'cash' : 'mobile_money')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                paymentMethod === 'mobile_money'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-panel border-border text-text-muted'
              }`}
            >
              <Smartphone size={12} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">M-pesa</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onDelete}
            disabled={disabled}
            className="rounded-full !bg-text !text-orange-500 border-none px-6 !text-[10px] font-black uppercase tracking-widest shadow-surface-pop hover:shadow-none"
          >
            Delete
          </Button>
          <Button
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-full !bg-text !text-primary border-none px-8 !text-[10px] font-black uppercase tracking-widest shadow-surface-pop hover:shadow-none"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
