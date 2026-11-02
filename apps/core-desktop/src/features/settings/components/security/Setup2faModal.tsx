import * as React from 'react';
import { Modal, Button, Field, FieldLabel } from '@40labs/ui-components';

interface Setup2faModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

export const Setup2faModal: React.FC<Setup2faModalProps> = ({ isOpen, onClose, onEnabled }) => {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setCode('');
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Two-Factor Authentication" size="md">
      <div className="space-y-4 p-2">
        <p className="text-xs text-text-muted">
          Scan the QR code below with your authenticator app, then enter the 6-digit verification code.
        </p>
        <div className="w-48 h-48 bg-panel-subtle border border-border rounded-card mx-auto flex items-center justify-center font-mono text-xs text-text-muted">
          [ TOTP QR Code ]
        </div>

        <Field>
          <FieldLabel required>Verification Code</FieldLabel>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            size="sm"
            disabled={code.length !== 6}
            onClick={() => {
              onEnabled();
              onClose();
            }}
          >
            Verify & Enable 2FA
          </Button>
        </div>
      </div>
    </Modal>
  );
};
