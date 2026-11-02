import * as React from 'react';
import { Modal, Button, Field, FieldLabel } from '@40labs/ui-components';
import { useUsers } from '../../../../hooks/useUsers';
import { usersApi } from '../../../../api/usersApi';
import { useStepUp } from '../../../auth/stepup/StepUpProvider';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlocked: () => void;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({ isOpen, onClose, onBlocked }) => {
  const { users } = useUsers();
  const { requestStepUp } = useStepUp();
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const activeUsers = users.filter((u) => u.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to block.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestStepUp(async () => {
        await usersApi.block(selectedUserId, reason.trim() || undefined);
      }, 'users.manage');
      onBlocked();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to block user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Block User Account" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <p className="text-xs text-text-muted">
          Blocking a user revokes their access and terminates their active sessions immediately. Requires SUDO step-up authorization.
        </p>

        {error && (
          <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel required>Select User Account</FieldLabel>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            required
          >
            <option value="">-- Choose user to block --</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.username} - {u.role})
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel>Reason for Blocking</FieldLabel>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for administrative suspension..."
            rows={3}
            className="w-full bg-panel border border-border rounded-input p-3 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" intent="primary" size="sm" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white">
            {loading ? 'Authorizing...' : 'Confirm & Block User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
