import * as React from 'react';
import { Modal, Button, PasswordInput } from '@40labs/ui-components';
import { PinField } from '../pin/PinField';
import { authApi } from '../../../api/authApi';
import { parseAuthError } from '../../../api/authErrors';

interface StepUpContextType {
  requestStepUp: (action: (grantToken?: string) => Promise<any>, permissionName?: string) => Promise<any>;
}

const StepUpContext = React.createContext<StepUpContextType | null>(null);

export const StepUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [permission, setPermission] = React.useState<string>('');
  const [tier, setTier] = React.useState<'self' | 'sudo'>('self');
  const [approvers, setApprovers] = React.useState<Array<{ userId: string; displayName: string; role: string }>>([]);
  const [selectedApprover, setSelectedApprover] = React.useState<string>('');
  const [method, setMethod] = React.useState<'pin' | 'password'>('pin');
  const [pin, setPin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);

  const resolveRef = React.useRef<((token: string | null) => void) | null>(null);

  const openModal = async (perm: string, t: 'self' | 'sudo'): Promise<string | null> => {
    setPermission(perm);
    setTier(t);
    setMethod('pin');
    setPin('');
    setPassword('');
    setErrorText(null);
    setRetryAfter(null);
    setIsOpen(true);

    if (t === 'sudo') {
      try {
        const list = await authApi.listApprovers(perm);
        setApprovers(list);
        if (list.length > 0) setSelectedApprover(list[0].userId);
      } catch {
        setApprovers([]);
      }
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  React.useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleStepUpComplete = async (completeSecret?: string) => {
    const secret = method === 'pin' ? (completeSecret || pin) : password;
    if (method === 'pin' && secret.length !== 6) return;
    if (method === 'password' && !secret) return;
    if (!permission) return;

    setLoading(true);
    setErrorText(null);
    setRetryAfter(null);
    try {
      const grantToken = await authApi.stepUp(
        permission,
        secret,
        method,
        tier === 'sudo' ? selectedApprover : undefined
      );
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current(grantToken);
        resolveRef.current = null;
      }
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

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(null);
      resolveRef.current = null;
    }
  };

  const requestStepUp = async (
    action: (grantToken?: string) => Promise<any>,
    permissionName?: string
  ): Promise<any> => {
    const perm = permissionName || 'general';
    try {
      return await action();
    } catch (err: any) {
      const parsed = parseAuthError(err);
      if (parsed.code === 'STEP_UP_REQUIRED') {
        const grantToken = await openModal(parsed.permission || perm, parsed.tier || 'self');
        if (grantToken) {
          return await action(grantToken);
        }
      }
      throw err;
    }
  };

  const isSubmitDisabled = method === 'pin' ? pin.length !== 6 || loading : !password || loading || retryAfter !== null;

  return (
    <StepUpContext.Provider value={{ requestStepUp }}>
      {children}
      <Modal isOpen={isOpen} onClose={handleCancel} title="Idhini ya Ziada (Step-up)" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 text-warning text-xs rounded-lg">
            Kitendo hiki kinahitaji uthibitisho wa ziada ({tier === 'sudo' ? 'SUDO Msimamizi' : 'Mtumiaji'}).
          </div>

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

          {tier === 'sudo' && approvers.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Chagua Msimamizi (SUDO)</label>
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
              <label className="text-sm font-medium text-foreground block mb-2 text-center">Weka PIN ya tarakimu 6</label>
              <PinField
                value={pin}
                onChange={setPin}
                onComplete={handleStepUpComplete}
                error={!!errorText}
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Weka Nenosiri</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitDisabled) handleStepUpComplete(); }}
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
            <Button type="button" intent="neutral" onClick={handleCancel}>
              Ghairi
            </Button>
            <Button disabled={isSubmitDisabled} onClick={() => handleStepUpComplete()}>
              {loading ? 'Inathibitisha...' : 'Thibitisha'}
            </Button>
          </div>
        </div>
      </Modal>
    </StepUpContext.Provider>
  );
};

export const useStepUp = () => {
  const ctx = React.useContext(StepUpContext);
  if (!ctx) {
    throw new Error('useStepUp must be used within a StepUpProvider');
  }
  return ctx;
};
