import * as React from 'react';
import { useSalesUiStore } from '../state/salesUiSlice';
import { SummaryFull } from './SummaryFull';
import { SummaryCompact } from './SummaryCompact';
import { SummaryToggle } from './SummaryToggle';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'credit';

export interface SalesSummaryBarProps {
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
  hasCustomer?: boolean;
}

export const SalesSummaryBar: React.FC<SalesSummaryBarProps> = (props) => {
  const { summaryMode, toggleSummaryMode, setSummaryMode } = useSalesUiStore();
  const isCompact = summaryMode === 'compact';

  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={[
        'relative flex flex-col transition-all duration-160 ease-out bg-surface-secondary rounded-[12px] border border-border/50 elevation-inset min-w-0',
        isCompact ? 'p-2' : 'p-3',
      ].join(' ')}
      style={{
        transitionProperty: 'height, padding',
      }}
    >
      <div className="absolute top-2 right-2 z-10">
        <SummaryToggle isCompact={isCompact} onToggle={toggleSummaryMode} />
      </div>

      {isCompact ? (
        <SummaryCompact
          {...props}
          onExpand={() => setSummaryMode('full')}
        />
      ) : (
        <SummaryFull {...props} />
      )}
    </div>
  );
};
export const SaleTotalsBar = SalesSummaryBar;
