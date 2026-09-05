import * as React from 'react';
import { Button } from '../primitives/Button';
import { HotkeyBadge } from '../primitives/Hotkey';

export interface DiscountEntry {
  label: string;
  amount: number;
}

export interface TaxEntry {
  label: string;
  rate: number;
  amount: number;
}

export interface CartSummaryPayload {
  subtotal: number;
  discounts: DiscountEntry[];
  taxes: TaxEntry[];
  grandTotal: number;
  currencyCode: string;
}

export interface CartSummaryPanelProps {
  payload: CartSummaryPayload;
  onConfirm: () => void;
  onClear: () => void;
  onHold?: () => void;
  isProcessing?: boolean;
  currencyFormatter?: (value: number, currency: string) => string;
  className?: string;
}

const defaultFormatter = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

/**
 * CartSummaryPanel composite component for transaction breakdowns and final checkout actions.
 * Refactored for dynamic API payloads supporting multiple discounts, tax rates and custom actions.
 */
export const CartSummaryPanel = ({
  payload,
  onConfirm,
  onClear,
  onHold,
  isProcessing = false,
  currencyFormatter = defaultFormatter,
  className = '',
}: CartSummaryPanelProps) => {
  const { subtotal, discounts, taxes, grandTotal, currencyCode } = payload;

  return (
    <div className={`p-4 bg-panel rounded-card elevation-raised border border-border/10 flex flex-col gap-6 ${className}`}>
      {/* Financial Breakdown */}
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted font-medium">Subtotal</span>
          <span className="font-mono text-text">{currencyFormatter(subtotal, currencyCode)}</span>
        </div>

        {discounts.map((d, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="text-text-muted font-medium">{d.label}</span>
            <span className="font-mono text-danger font-bold">
              - {currencyFormatter(d.amount, currencyCode)}
            </span>
          </div>
        ))}

        {taxes.map((t, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="text-text-muted font-medium">{t.label} ({t.rate}%)</span>
            <span className="font-mono text-text">{currencyFormatter(t.amount, currencyCode)}</span>
          </div>
        ))}
      </div>

      {/* Prominent Grand Total Callout */}
      <div className="p-5 bg-field text-text-on-field rounded-card elevation-inset border border-black/5 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 mb-2">
          Grand Total
        </p>
        <p className="relative z-10 text-3xl font-mono font-bold text-primary tracking-tight">
          {currencyFormatter(grandTotal, currencyCode)}
        </p>
      </div>

      {/* Checkout Actions */}
      <div className="flex flex-col gap-2">
        <Button
          intent="primary"
          size="lg"
          fullWidth
          loading={isProcessing}
          onClick={onConfirm}
          rightIcon={
            <HotkeyBadge className="!bg-black/20 !text-surface !border-white/10 !text-[9px] !px-1">
              ENTER
            </HotkeyBadge>
          }
        >
          Confirm Transaction
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {onHold && (
            <Button
              intent="neutral"
              size="md"
              onClick={onHold}
              disabled={isProcessing}
              className="text-xs"
            >
              Hold Bill
            </Button>
          )}
          <Button
            intent="ghost"
            size="md"
            fullWidth={!onHold}
            onClick={onClear}
            disabled={isProcessing}
            className={`text-xs text-text-muted hover:text-danger hover:bg-danger/5 ${!onHold ? 'w-full' : ''}`}
          >
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
