import * as React from 'react';
import { Button, Field, FieldLabel, Modal, Input } from '@40labs/ui-components';

export interface ForwardReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (toUserId: string, note?: string) => Promise<unknown>;
  users: any[];
  loading?: boolean;
}

export const ForwardReportDialog: React.FC<ForwardReportDialogProps> = ({
  isOpen,
  onClose,
  onForward,
  users,
  loading,
}) => {
  const [toUserId, setToUserId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToUserId('');
    setNote('');
    setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId) {
      setError('Please select a staff member to forward this report to.');
      return;
    }
    try {
      await onForward(toUserId, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to forward report.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forward Lab Report"
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" intent="neutral" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="forward-report-form" intent="primary" disabled={loading}>
            {loading ? 'Forwarding…' : 'Forward Report'}
          </Button>
        </div>
      }
    >
      <form id="forward-report-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Field>
          <FieldLabel required>Recipient Staff Member</FieldLabel>
          <select
            className="w-full bg-panel border border-border rounded-md p-2 text-sm text-text"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
          >
            <option value="">Select recipient...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role?.toUpperCase() || 'STAFF'})
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel>Forwarding Note (Optional)</FieldLabel>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a clinical or review note..."
          />
        </Field>
      </form>
    </Modal>
  );
};
