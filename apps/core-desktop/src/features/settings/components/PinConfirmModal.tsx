import * as React from 'react';
import { Modal, Button, Field, FieldLabel, Input } from '@40labs/ui-components';
import { Lock } from 'lucide-react';

interface PinConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: (pin: string) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PinConfirmModal: React.FC<PinConfirmModalProps> = ({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [pin, setPin] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setPin('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || isLoading) return;
    await onConfirm(pin.trim());
    setPin('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            intent="neutral"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            intent="danger"
            onClick={handleSubmit}
            disabled={!pin.trim() || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Confirm with PIN'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-warning/10 text-warning text-xs rounded-card">
          <Lock size={16} className="shrink-0" />
          <span>Security Authorization: Enter master admin or owner PIN to authorize this sensitive action.</span>
        </div>

        <Field>
          <FieldLabel required>Administrator PIN</FieldLabel>
          <Input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4-6 digit PIN"
            autoFocus
          />
        </Field>
      </form>
    </Modal>
  );
};
