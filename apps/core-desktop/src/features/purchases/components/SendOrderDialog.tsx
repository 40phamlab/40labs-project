// [PHASE: marketplace-preview — Order flow]
import * as React from 'react';
import { Supplier, SupplierCart } from '@40labs/types';
import { Modal, Button, Input } from '@40labs/ui-components';
import { Send, AlertCircle } from 'lucide-react';

export interface SendOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  cart: SupplierCart;
  onConfirmSend: (note: string) => Promise<void>;
  isSending?: boolean;
}

export const SendOrderDialog: React.FC<SendOrderDialogProps> = ({
  isOpen,
  onClose,
  supplier,
  cart,
  onConfirmSend,
  isSending = false,
}) => {
  const [note, setNote] = React.useState('');

  const subtotal = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
  const totalFormatted = `TZS ${subtotal.toLocaleString()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmSend(note);
    setNote('');
    onClose();
  };

  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send Order to ${supplier.name}`} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2 text-xs">
        <div className="p-3 bg-panel-strong rounded-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Channel</span>
            <span className="font-bold text-text">WhatsApp (wa.me)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Items Count</span>
            <span className="font-bold text-text">{cart.lines.length} items</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <span className="text-text-muted uppercase text-[10px] font-bold">Estimated Total</span>
            <span className="font-mono font-bold text-primary text-sm">{totalFormatted}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-text">Order Note / Instructions (Optional)</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Please deliver before noon..."
            className="text-xs"
          />
        </div>

        <div className="p-3 bg-accent/10 border border-accent/20 rounded-card flex items-start gap-2 text-text">
          <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Opening WhatsApp requires an internet connection. If offline, the order is queued locally and outbox record is saved.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
          <Button intent="neutral" type="button" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button intent="primary" type="submit" disabled={isSending || cart.lines.length === 0} leftIcon={<Send size={14} />}>
            {isSending ? 'Sending Order...' : 'Authorize & Send via WhatsApp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
