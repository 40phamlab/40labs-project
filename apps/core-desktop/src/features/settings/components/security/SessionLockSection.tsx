import * as React from 'react';
import { Panel, Button, Field, FieldLabel, StatusBadge } from '@40labs/ui-components';
import { Clock, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../../api/authApi';
import { useStepUp } from '../../../auth/stepup/StepUpProvider';

interface SessionLockSectionProps {
  initialIdleMinutes: number;
  isOnboardingSetupComplete: boolean;
  setToast: (msg: string) => void;
}

export const SessionLockSection: React.FC<SessionLockSectionProps> = ({
  initialIdleMinutes,
  isOnboardingSetupComplete,
  setToast,
}) => {
  const { requestStepUp } = useStepUp();
  const [idleMinutes, setIdleMinutes] = React.useState<number>(initialIdleMinutes || 5);
  const [isUpdatingIdle, setIsUpdatingIdle] = React.useState(false);
  const [policies, setPolicies] = React.useState<Array<{ permission: string; tier: string; ttlSecs: number; maxUses: number }>>([]);

  React.useEffect(() => {
    setIdleMinutes(initialIdleMinutes || 5);
  }, [initialIdleMinutes]);

  React.useEffect(() => {
    authApi.stepUpPolicies()
      .then((p) => setPolicies(p))
      .catch(() => setPolicies([]));
  }, []);

  const handleIdleLockSubmit = async () => {
    setIsUpdatingIdle(true);
    try {
      await requestStepUp(async () => {
        await authApi.businessSetIdleLock(idleMinutes);
      }, 'settings.manage:idle');
      setToast('Automatic session idle lock duration updated.');
    } catch (err: any) {
      setToast(err?.message || 'Failed to update idle lock duration.');
    } finally {
      setIsUpdatingIdle(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text-primary tracking-tight">Session Lock & Sensitive Operations</h2>
        <p className="text-xs text-text-muted">Configure inactivity idle lock and step-up authentication for sensitive actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Automatic Session Lock</h3>
              <p className="text-xs text-text-muted">Automatically lock workspace after inactivity.</p>
            </div>
          </div>

          <Field>
            <FieldLabel>Inactivity Timeout Duration</FieldLabel>
            <select
              value={idleMinutes}
              onChange={(e) => setIdleMinutes(Number(e.target.value))}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </Field>

          <div className="pt-2">
            <Button
              type="button"
              intent="primary"
              size="md"
              onClick={handleIdleLockSubmit}
              disabled={isUpdatingIdle}
              className="w-full"
            >
              {isUpdatingIdle ? 'Saving...' : 'Save Idle Lock Settings'}
            </Button>
          </div>
        </Panel>

        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOnboardingSetupComplete ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">SUDO Step-Up Protection</h3>
              <p className="text-xs text-text-muted">Require PIN verification for administrative tasks.</p>
            </div>
          </div>

          <div className="p-4 bg-panel-subtle rounded-card border border-border/50 space-y-3 text-xs text-text-secondary">
            <div className="flex items-center justify-between font-bold text-text-primary">
              <span>Status:</span>
              <StatusBadge
                status={isOnboardingSetupComplete ? 'success' : 'warning'}
                label={isOnboardingSetupComplete ? 'ACTIVE (ENFORCED)' : 'SETUP INCOMPLETE'}
              />
            </div>
            <p className="text-[11px] text-text-muted">
              {isOnboardingSetupComplete
                ? 'Sensitive actions require re-authentication with PIN or password.'
                : 'Setup is incomplete. Step-up policies operate in pre-setup mode.'}
            </p>

            {policies.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="font-bold text-text-primary text-[11px]">Protected Permissions:</div>
                <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
                  {policies.map((p, i) => (
                    <div key={i} className="flex justify-between text-text-muted">
                      <span>{p.permission}</span>
                      <span className="uppercase text-primary font-bold">{p.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};
