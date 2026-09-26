import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  NumberInput,
  PasswordInput,
} from '@40labs/ui-components';
import type { MedicineWithInventory } from '@40labs/types';
import type { StockActionType, RecordStockActionPayload } from '../../../hooks/useInventory';

export interface StockActionModalProps {
  item: MedicineWithInventory | null;
  actionType: StockActionType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: RecordStockActionPayload) => Promise<void>;
  isLoading?: boolean;
}

export const StockActionModal: React.FC<StockActionModalProps> = ({
  item,
  actionType,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = React.useState<string>('0');
  const [reason, setReason] = React.useState<string>('');
  const [pin, setPin] = React.useState<string>('');

  React.useEffect(() => {
    if (item && actionType) {
      if (actionType === 'refill') {
        setQuantity('10');
        setReason('Routine stock refill / batch top-up');
      } else if (actionType === 'adjustment') {
        setQuantity(String(item.quantity));
        setReason('Stock count discrepancy adjustment');
      } else if (actionType === 'damaged') {
        setQuantity('1');
        setReason('Damaged during storage/transport');
      } else if (actionType === 'expired') {
        setQuantity(String(item.quantity));
        setReason('Batch reached expiration date');
      } else if (actionType === 'disposed') {
        setQuantity(String(item.quantity));
        setReason('Disposed per health regulation protocol');
      } else if (actionType === 'transferred') {
        setQuantity('1');
        setReason('Transferred to secondary branch/dispensary');
      } else if (actionType === 'deactivated') {
        setQuantity('0');
        setReason('Batch deactivated and archived');
      }
      setPin('');
    }
  }, [item, actionType, isOpen]);

  if (!item || !actionType) return null;

  const isDeactivating = actionType === 'deactivated';

  const getActionTitle = () => {
    switch (actionType) {
      case 'refill':
        return 'Refill Stock';
      case 'adjustment':
        return 'Adjust Stock Level';
      case 'damaged':
        return 'Record Damaged Stock';
      case 'expired':
        return 'Record Expired Stock';
      case 'disposed':
        return 'Dispose Stock';
      case 'transferred':
        return 'Transfer Stock';
      case 'deactivated':
        return 'Deactivate Inventory Batch';
      default:
        return 'Stock Action';
    }
  };

  const getQuantityLabel = () => {
    switch (actionType) {
      case 'refill':
        return 'Quantity to Add';
      case 'adjustment':
        return 'New Total Stock Quantity';
      case 'damaged':
        return 'Quantity Damaged';
      case 'expired':
        return 'Quantity Expired';
      case 'disposed':
        return 'Quantity Disposed';
      case 'transferred':
        return 'Quantity Transferred';
      case 'deactivated':
      default:
        return 'Quantity';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const numQty = Number(quantity) || 0;
    const payload: RecordStockActionPayload = {
      inventoryItemId: item.id,
      action: actionType,
      reason: reason || `Action: ${actionType}`,
      authorizedPin: pin || undefined,
    };

    if (actionType === 'adjustment') {
      payload.newQuantity = numQty;
    } else if (actionType === 'refill') {
      payload.quantityDelta = Math.abs(numQty);
    } else if (actionType === 'deactivated') {
      payload.quantityDelta = 0;
    } else {
      payload.quantityDelta = -Math.abs(numQty);
    }

    await onConfirm(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getActionTitle()}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="neutral" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDeactivating ? 'danger' : 'primary'}
            onClick={handleSubmit as any}
            disabled={isLoading || (!isDeactivating && Number(quantity) < 0)}
          >
            {isLoading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-surface-secondary/60 rounded-card border border-border-default space-y-1">
          <p className="text-xs font-bold text-text-primary">
            {item.medicine.name}
          </p>
          <div className="flex gap-4 text-xs text-text-muted">
            <span>Batch: <strong className="font-mono text-text-primary">{item.batch_number}</strong></span>
            <span>Current Quantity: <strong className="font-mono text-text-primary">{item.quantity} {item.medicine.unit}</strong></span>
          </div>
        </div>

        {isDeactivating ? (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-card text-xs text-danger font-medium">
            Deactivating this batch marks it as archived. It will produce an audit log entry and will no longer appear in active POS sales.
          </div>
        ) : (
          <Field>
            <FieldLabel required>{getQuantityLabel()}</FieldLabel>
            <NumberInput
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </Field>
        )}

        <Field>
          <FieldLabel required>Action Reason / Audit Notes</FieldLabel>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide justification for audit log..."
          />
        </Field>

        <Field>
          <FieldLabel>Staff PIN (Authorization)</FieldLabel>
          <PasswordInput
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter staff PIN (optional)"
          />
        </Field>
      </form>
    </Modal>
  );
};
