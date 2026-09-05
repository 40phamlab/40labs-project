import * as React from 'react';
import { X, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../primitives/Button';
import { IconButton } from '../primitives/IconButton';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { Card } from '../primitives/Card';

export interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
  referenceCode?: string;
}

export interface SplitPaymentManagerProps {
  totalAmount: number;
  onPaymentsChange?: (payments: Omit<PaymentEntry, 'id'>[]) => void;
  className?: string;
}

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Insurance', value: 'insurance' },
];

export const SplitPaymentManager = ({
  totalAmount,
  onPaymentsChange,
  className = '',
}: SplitPaymentManagerProps) => {
  const [payments, setPayments] = React.useState<PaymentEntry[]>([
    { id: '1', method: 'cash', amount: 0 },
  ]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalAmount - totalPaid;
  const isOverpaid = totalPaid > totalAmount;
  const isFullyPaid = totalPaid === totalAmount;

  const updatePayments = (newPayments: PaymentEntry[]) => {
    setPayments(newPayments);
    onPaymentsChange?.(newPayments.map(({ id, ...rest }) => rest));
  };

  const addPayment = () => {
    const remaining = Math.max(0, balance);
    const newPayment = {
      id: Math.random().toString(36).substr(2, 9),
      method: 'cash',
      amount: remaining,
    };
    updatePayments([...payments, newPayment]);
  };

  const removePayment = (id: string) => {
    if (payments.length === 1) {
      updatePayments([{ ...payments[0], amount: 0 }]);
      return;
    }
    updatePayments(payments.filter((p) => p.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<PaymentEntry>) => {
    updatePayments(
      payments.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header Info */}
      <div className="flex justify-between items-end p-4 bg-panel-strong rounded-card shadow-inner-soft">
        <div>
          <p className="text-caption text-text-muted uppercase font-bold tracking-widest mb-1">Total Target</p>
          <p className="text-xl font-mono font-bold text-text">TZS {totalAmount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className={`text-caption uppercase font-bold tracking-widest mb-1 ${
            isOverpaid ? 'text-accent' : isFullyPaid ? 'text-primary' : 'text-text-muted'
          }`}>
            {isOverpaid ? 'Change Due' : isFullyPaid ? 'Paid' : 'Remaining'}
          </p>
          <p className={`text-xl font-mono font-bold ${
            isOverpaid ? 'text-accent' : isFullyPaid ? 'text-primary' : 'text-danger'
          }`}>
            TZS {Math.abs(balance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment Rows */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Select
                value={payment.method}
                onChange={(e) => handleUpdate(payment.id, { method: e.target.value })}
                className="!h-10"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>

              <Input
                type="number"
                value={payment.amount || ''}
                onChange={(e) => handleUpdate(payment.id, { amount: Number(e.target.value) || 0 })}
                placeholder="Amount"
                monospace
                className="!h-10 text-right"
              />

              <Input
                value={payment.referenceCode || ''}
                onChange={(e) => handleUpdate(payment.id, { referenceCode: e.target.value })}
                placeholder="Ref Code (Optional)"
                className="!h-10 hidden sm:block"
              />
            </div>

            <IconButton
              icon={<X size={14} />}
              label="Remove Payment"
              intent="ghost"
              size="sm"
              className="mt-1"
              onClick={() => removePayment(payment.id)}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <Button
        intent="secondary"
        size="sm"
        fullWidth
        onClick={addPayment}
        leftIcon={<Plus size={14} />}
        className="dashed border-dashed border-primary/40 hover:bg-primary/5"
      >
        Add Another Payment Method
      </Button>

      {!isFullyPaid && !isOverpaid && balance > 0 && (
        <div className="p-3 bg-danger/5 border border-danger/20 rounded-input flex items-center gap-2">
          <AlertCircle size={14} className="text-danger" />
          <p className="text-tiny text-text-muted">Underpaid by TZS {balance.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};
