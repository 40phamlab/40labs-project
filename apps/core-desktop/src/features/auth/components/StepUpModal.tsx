import * as React from 'react';
import { Modal, Button, PasswordInput } from '@40labs/ui-components';
import { PinOtpInput } from './PinOtpInput';
import { authApi } from '../../../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import { parseAuthError } from '../../../api/authErrors';

export const StepUpModal: React.FC = () => {
  const { stepUpModal, closeStepUp } = useAuthStore();
  const [method, setMethod] = React.useState<'pin' | 'password'>('pin');
  const [pin, setPin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [approvers, setApprovers] = React.useState<Array<{ userId: string; displayName: string; role: string }>>([]);
  const [selectedApprover, setSelectedApprover] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (stepUpModal.isOpen && stepUpModal.permission) {
      setMethod('pin');
      setPin('');
      setPassword('');
      setErrorText(null);
      setRetryAfter(null);
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

  React.useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = async (completeSecret?: string) => {
    const secret = method === 'pin' ? (completeSecret || pin) : password;
    if (method === 'pin' && secret.length !== 6) return;
    if (method === 'password' && !secret) return;
    if (!stepUpModal.permission) return;

    setLoading(true);
    setErrorText(null);
    setRetryAfter(null);
    try {
      const grantToken = await authApi.stepUp(
        stepUpModal.permission,
        secret,
        method,
        stepUpModal.tier === 'sudo' ? selectedApprover : undefined
      );
      if (stepUpModal.onSuccess) {
        stepUpModal.onSuccess(grantToken);
      }
      closeStepUp();
    } catch (err: any) {
      const parsed = parseAuthError(err);
      if (parsed.code === 'PIN_SETUP_REQUIRED' && method === 'pin') {
        setMethod('password');
        setPin('');
        setErrorText('PIN haijawekwa. Tafadhali tumia nenosiri.');
      } else if (parsed.code === 'LOCKED' || parsed.retryAfterSecs) {
        const secs = parsed.retryAfterSecs || 30;
        setRetryAfter(secs);
        setErrorText(`Majaribio yamezidi. Tafadhali subiri sekunde ${secs}.`);
      } else {
        setErrorText(method === 'pin' ? 'PIN si sahihi' : 'Nenosiri si sahihi');
      }
      if (method === 'pin') setPin('');
      else setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = method === 'pin' ? pin.length !== 6 || loading : !password || loading || retryAfter !== null;

  return (
    <Modal isOpen={stepUpModal.isOpen} onClose={closeStepUp} title="Idhini ya Ziada">
      <div className="space-y-4">
        {/* Segmented Toggle */}
        <div className="flex bg-panel-subtle p-1 rounded-card border border-border">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${method === 'pin' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => { setMethod('pin'); setPassword(''); setErrorText(null); }}
          >
            PIN
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${method === 'password' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => { setMethod('password'); setPin(''); setErrorText(null); }}
          >
            Nenosiri / Password
          </button>
        </div>

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

        {method === 'pin' ? (
          <div>
            <label className="text-sm font-medium text-foreground block mb-2 text-center">Weka PIN</label>
            <PinOtpInput
              value={pin}
              onChange={setPin}
              onComplete={handleSubmit}
              error={!!errorText}
            />
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Weka Nenosiri</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitDisabled) handleSubmit(); }}
              placeholder="Ingiza nenosiri lako..."
            />
          </div>
        )}

        {errorText && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-card text-center font-medium">
            {errorText} {retryAfter !== null && `(${retryAfter}s)`}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button intent="neutral" onClick={() => {
            if (stepUpModal.onCancel) stepUpModal.onCancel();
            closeStepUp();
          }}>
            Ghairi
          </Button>
          <Button disabled={isSubmitDisabled} onClick={() => handleSubmit()}>
            {loading ? 'Inathibitisha...' : 'Thibitisha'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
