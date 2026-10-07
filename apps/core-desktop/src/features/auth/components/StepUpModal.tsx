import * as React from 'react';
import { Modal, Button } from '@40labs/ui-components';
import { PinOtpInput } from './PinOtpInput';
import { authApi } from '../../../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';

export const StepUpModal: React.FC = () => {
  const { stepUpModal, closeStepUp } = useAuthStore();
  const [pin, setPin] = React.useState('');
  const [approvers, setApprovers] = React.useState<Array<{ userId: string; displayName: string; role: string }>>([]);
  const [selectedApprover, setSelectedApprover] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (stepUpModal.isOpen && stepUpModal.permission) {
      setPin('');
      setError(null);
      if (stepUpModal.tier === 'sudo') {
        authApi.listApprovers(stepUpModal.permission)
          .then((list) => {
            setApprovers(list);
            if (list.length > 0) setSelectedApprover(list[0].userId);
          })
          .catch(() => setApprovers([]));
      }
    }
  }, [stepUpModal.isOpen, stepUpModal.permission, stepUpModal.tier]);

  const handleSubmit = async (completePin?: string) => {
    const finalPin = completePin || pin;
    if (finalPin.length !== 6 || !stepUpModal.permission) return;

    setLoading(true);
    setError(null);
    try {
      const grantToken = await authApi.stepUp(
        stepUpModal.permission,
        finalPin,
        stepUpModal.tier === 'sudo' ? selectedApprover : undefined
      );
      if (stepUpModal.onSuccess) {
        stepUpModal.onSuccess(grantToken);
      }
      closeStepUp();
    } catch (err: any) {
      setError(err?.code || 'INVALID_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={stepUpModal.isOpen} onClose={closeStepUp} title="Idhini ya Ziada">
      <div className="space-y-4">
        {stepUpModal.tier === 'sudo' && approvers.length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Msimamizi (SUDO)</label>
            <select
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
              className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
            >
              {approvers.map((a) => (
                <option key={a.userId} value={a.userId}>
                  {a.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-2 text-center">Weka PIN</label>
          <PinOtpInput
            value={pin}
            onChange={setPin}
            onComplete={handleSubmit}
            error={!!error}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button intent="neutral" onClick={() => {
            if (stepUpModal.onCancel) stepUpModal.onCancel();
            closeStepUp();
          }}>
            Ghairi
          </Button>
          <Button disabled={pin.length !== 6 || loading} onClick={() => handleSubmit()}>
            {loading ? 'Inathibitisha...' : 'Thibitisha'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
