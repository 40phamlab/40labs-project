import * as React from 'react';
import { Modal, Button } from '@40labs/ui-components';
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
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resolveRef = React.useRef<((token: string | null) => void) | null>(null);

  const openModal = async (perm: string, t: 'self' | 'sudo'): Promise<string | null> => {
    setPermission(perm);
    setTier(t);
    setPin('');
    setError(null);
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

  const handleStepUpComplete = async (completePin?: string) => {
    const finalPin = completePin || pin;
    if (finalPin.length !== 6 || !permission) return;

    setLoading(true);
    setError(null);
    try {
      const grantToken = await authApi.stepUp(
        permission,
        finalPin,
        tier === 'sudo' ? selectedApprover : undefined
      );
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current(grantToken);
        resolveRef.current = null;
      }
    } catch (err: any) {
      const parsed = parseAuthError(err);
      setError(parsed.code === 'LOCKED' ? 'Majaribio yamezidi. Kikao kimefutwa.' : 'PIN si sahihi');
      setPin('');
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

  return (
    <StepUpContext.Provider value={{ requestStepUp }}>
      {children}
      <Modal isOpen={isOpen} onClose={handleCancel} title="Idhini ya Ziada (Step-up)" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 text-warning text-xs rounded-lg">
            Kitendo hiki kinahitaji uthibitisho wa ziada wa PIN ({tier === 'sudo' ? 'SUDO Msimamizi' : 'Mtumiaji'}).
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

          <div>
            <label className="text-sm font-medium text-foreground block mb-2 text-center">Weka PIN ya tarakimu 6</label>
            <PinField
              value={pin}
              onChange={setPin}
              onComplete={handleStepUpComplete}
              error={!!error}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" intent="neutral" onClick={handleCancel}>
              Ghairi
            </Button>
            <Button disabled={pin.length !== 6 || loading} onClick={() => handleStepUpComplete()}>
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
