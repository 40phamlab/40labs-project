import * as React from 'react';
import { CartSummary, PaymentMethod } from '../../../shared/commerce';

export type { PaymentMethod };

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
    <CartSummary
      subtotal={subtotal}
      discount={discount}
      onDiscountChange={onDiscountChange}
      tax={tax}
      grandTotal={grandTotal}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={onPaymentMethodChange}
      onConfirm={onConfirm}
      onDelete={onDelete}
      onHold={onHold}
      disabled={disabled}
      isProcessing={isProcessing}
      mode="sale"
    />
  );
};
