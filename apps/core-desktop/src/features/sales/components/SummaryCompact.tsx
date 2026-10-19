import * as React from 'react';
import { Button, MoneyDisplay } from '@40labs/ui-components';
import { Pause, Trash2, Check, CreditCard, Smartphone, Banknote, Tag } from 'lucide-react';
import { t } from '@40labs/i18n';

export interface SummaryCompactProps {
  grandTotal: number;
  discount: number;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  onConfirm: () => void;
  onDelete: () => void;
  onHold?: () => void;
  disabled: boolean;
  isProcessing?: boolean;
  hasCustomer?: boolean;
  onExpand: () => void;
}

export const SummaryCompact: React.FC<SummaryCompactProps> = ({
  grandTotal,
  discount,
  paymentMethod,
  onConfirm,
  onDelete,
  onHold,
  disabled,
  isProcessing = false,
  hasCustomer = true,
  onExpand,
}) => {
  const showSafetyChip = paymentMethod !== 'cash' || discount > 0;

  const handleConfirmClick = () => {
    if (paymentMethod === 'credit' && !hasCustomer) {
      onExpand();
      return;
    }
    onConfirm();
  };

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'mobile_money':
        return <Smartphone size={12} />;
      case 'card':
        return <CreditCard size={12} />;
      case 'credit':
        return <Tag size={12} />;
      default:
        return <Banknote size={12} />;
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 h-10 min-w-0 pr-8">
      {/* Left: Total & Safety Chip */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={onExpand}
        title="Click to expand summary details"
      >
        <div className="flex flex-col min-w-0">
          <MoneyDisplay
            amount={grandTotal}
            emphasis="strong"
            className="text-lg text-primary font-mono font-bold truncate"
          />
        </div>

        {showSafetyChip && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-[10px] font-medium shrink-0">
            {getPaymentIcon()}
            <span className="capitalize">{paymentMethod.replace('_', ' ')}</span>
            {discount > 0 && <span className="font-mono">(-TZS {discount.toLocaleString()})</span>}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onDelete && (
          <Button
            type="button"
            intent="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled || isProcessing}
            title={t('sales.clear')}
            aria-label={t('sales.clear')}
            className="!p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-[8px]"
          >
            <Trash2 size={16} />
          </Button>
        )}

        {onHold && (
          <Button
            type="button"
            intent="neutral"
            size="sm"
            onClick={onHold}
            disabled={disabled || isProcessing}
            leftIcon={<Pause size={14} />}
            title={t('sales.hold')}
            aria-label={t('sales.hold')}
            className="rounded-[8px] px-3 text-xs"
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
          onClick={handleConfirmClick}
          title="Ctrl+Enter"
          aria-label={t('sales.confirm')}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[8px] !w-11 !h-11 !min-w-[44px] !min-h-[44px] !p-0 flex items-center justify-center shadow-sm"
        >
          <Check size={20} />
        </Button>
      </div>
    </div>
  );
};
