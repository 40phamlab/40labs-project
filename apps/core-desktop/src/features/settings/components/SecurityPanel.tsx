import * as React from 'react';
import { Panel, Button, Field, FieldLabel, PasswordInput } from '@40labs/ui-components';
import { Lock, Key, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import { useDevices } from '../../../hooks/useDevices';
import { useStepUp } from '../../auth/stepup/StepUpProvider';
import { authApi } from '../../../api/authApi';

interface SecurityPanelProps {
  onNavigateToDevices: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ onNavigateToDevices }) => {
  const { changePin, changePassword, isChangingPin, isChangingPassword } = useUsers();
  const { devices } = useDevices();
  const { requestStepUp } = useStepUp();

  // PIN state
  const [pinForm, setPinForm] = React.useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinSuccess, setPinSuccess] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);

  // Password state
  const [passForm, setPassForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passSuccess, setPassSuccess] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);

  // Idle lock state
  const [idleMinutes, setIdleMinutes] = React.useState<number>(5);
  const [idleSuccess, setIdleSuccess] = React.useState(false);

  // Recovery codes state
  const [regenPassword, setRegenPassword] = React.useState('');
  const [newCodes, setNewCodes] = React.useState<Array<string> | null>(null);
  const [regenError, setRegenError] = React.useState<string | null>(null);

  // Device counts
  const activeDeviceCount = devices.filter((d) => d.status === 'active').length;
  const blockedDeviceCount = devices.filter((d) => d.status === 'blocked').length;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(false);

    if (!pinForm.currentPin) {
      setPinError('Current PIN is required.');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      setPinError('PIN must be 6 digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    try {
      await changePin(pinForm.currentPin, pinForm.newPin);
      setPinSuccess(true);
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (err: any) {
      setPinError(err?.code || 'Failed to update PIN.');
    }
  };

  const handlePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!passForm.currentPassword) {
      setPassError('Current password is required.');
      return;
    }
    if (passForm.newPassword.length < 8) {
      setPassError('Password must be at least 8 characters.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      await changePassword(passForm.currentPassword, passForm.newPassword);
      setPassSuccess(true);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPassError(err?.code || 'Failed to update password.');
    }
  };

  const handleIdleLockSubmit = async () => {
    setIdleSuccess(false);
    try {
      await requestStepUp(async () => {
        await authApi.businessSetIdleLock(idleMinutes);
      }, 'settings.manage:idle');
      setIdleSuccess(true);
    } catch (err: any) {
      console.error('Idle lock update failed:', err);
    }
  };

  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenError(null);
    setNewCodes(null);
    if (!regenPassword) {
      setRegenError('Nenosiri linahitajika');
      return;
    }

    try {
      const codes = await authApi.recoveryRegenerate(regenPassword);
      setNewCodes(codes);
      setRegenPassword('');
    } catch (err: any) {
      setRegenError(err?.code || 'Imeshindwa kutengeneza namba mpya');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Card 1: Change PIN */}
        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Change PIN</h3>
            </div>
          </div>

          {pinSuccess && (
            <div className="p-3 bg-success/10 text-success text-xs rounded-card flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>PIN successfully updated!</span>
            </div>
          )}

          {pinError && (
            <div className="p-2.5 bg-danger/10 text-danger text-xs rounded-card">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <Field>
              <FieldLabel required>Current PIN</FieldLabel>
              <PasswordInput
                maxLength={6}
                value={pinForm.currentPin}
                onChange={(e: any) => setPinForm((p) => ({ ...p, currentPin: e.target.value }))}
                placeholder="Current PIN"
              />
            </Field>

            <Field>
              <FieldLabel required>New PIN (6 digits)</FieldLabel>
              <PasswordInput
                maxLength={6}
                value={pinForm.newPin}
                onChange={(e: any) => setPinForm((p) => ({ ...p, newPin: e.target.value }))}
                placeholder="New 6-digit PIN"
              />
            </Field>

            <Field>
              <FieldLabel required>Confirm New PIN</FieldLabel>
              <PasswordInput
                maxLength={6}
                value={pinForm.confirmPin}
                onChange={(e: any) => setPinForm((p) => ({ ...p, confirmPin: e.target.value }))}
                placeholder="Confirm PIN"
              />
            </Field>

            <Button
              type="submit"
              intent="primary"
              size="sm"
              className="w-full"
              disabled={isChangingPin || !pinForm.currentPin || pinForm.newPin.length !== 6}
            >
              {isChangingPin ? 'Updating PIN...' : 'Update PIN'}
            </Button>
          </form>
        </Panel>

        {/* Card 2: Change Password */}
        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Change Password</h3>
            </div>
          </div>

          {passSuccess && (
            <div className="p-3 bg-success/10 text-success text-xs rounded-card flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Password successfully updated!</span>
            </div>
          )}

          {passError && (
            <div className="p-2.5 bg-danger/10 text-danger text-xs rounded-card">
              {passError}
            </div>
          )}

          <form onSubmit={handlePassSubmit} className="space-y-3">
            <Field>
              <FieldLabel required>Current Password</FieldLabel>
              <PasswordInput
                value={passForm.currentPassword}
                onChange={(e: any) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Current Password"
              />
            </Field>

            <Field>
              <FieldLabel required>New Password</FieldLabel>
              <PasswordInput
                value={passForm.newPassword}
                onChange={(e: any) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="New Password"
              />
            </Field>

            <Field>
              <FieldLabel required>Confirm New Password</FieldLabel>
              <PasswordInput
                value={passForm.confirmPassword}
                onChange={(e: any) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm Password"
              />
            </Field>

            <Button
              type="submit"
              intent="primary"
              size="sm"
              className="w-full"
              disabled={isChangingPassword || !passForm.currentPassword || !passForm.newPassword}
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </Panel>
      </div>

      {/* Card 3: Idle Lock & Recovery Codes */}
      <div className="grid grid-cols-2 gap-6">
        <Panel variant="raised" className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Idle Lock Duration (SUDO)</h3>
          {idleSuccess && (
            <div className="p-2 bg-success/10 text-success text-xs rounded">Muda umehifadhiwa!</div>
          )}
          <div className="space-y-3">
            <select
              value={idleMinutes}
              onChange={(e) => setIdleMinutes(Number(e.target.value))}
              className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2.5 text-text-primary"
            >
              {[1, 2, 3, 5, 10, 15, 20, 25, 30].map((m) => (
                <option key={m} value={m}>{m} dakika</option>
              ))}
            </select>
            <Button intent="neutral" size="sm" className="w-full" onClick={handleIdleLockSubmit}>
              Badili Muda (SUDO Step-up)
            </Button>
          </div>
        </Panel>

        <Panel variant="raised" className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Regenerate Recovery Codes (SUDO)</h3>
          {newCodes ? (
            <div className="space-y-2">
              <p className="text-xs text-success font-semibold">Namba mpya za rejesho (zimeonyeshwa mara moja tu):</p>
              <div className="grid grid-cols-2 gap-1 font-mono text-xs bg-background p-2 rounded border">
                {newCodes.map((c, i) => <span key={i}>{c}</span>)}
              </div>
              <Button intent="neutral" size="sm" onClick={() => setNewCodes(null)}>Ficha</Button>
            </div>
          ) : (
            <form onSubmit={handleRegenerateCodes} className="space-y-3">
              {regenError && <div className="text-danger text-xs">{regenError}</div>}
              <Field>
                <FieldLabel required>Nenosiri la sasa</FieldLabel>
                <PasswordInput
                  value={regenPassword}
                  onChange={(e: any) => setRegenPassword(e.target.value)}
                  placeholder="Password"
                />
              </Field>
              <Button type="submit" intent="danger" size="sm" className="w-full">
                Tengeneza Namba Mpya za Rejesho
              </Button>
            </form>
          )}
        </Panel>
      </div>

      {/* Card 4: Paired Devices Summary */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Smartphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Paired Devices Summary (Read-Only)</h3>
            </div>
          </div>

          <Button
            intent="neutral"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            onClick={onNavigateToDevices}
          >
            Manage in Devices Panel
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-panel-subtle rounded-card border border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Active Orbit Terminals</span>
            <span className="text-lg font-bold font-mono text-primary">{activeDeviceCount}</span>
          </div>

          <div className="p-4 bg-panel-subtle rounded-card border border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Blocked / Revoked Devices</span>
            <span className="text-lg font-bold font-mono text-danger">{blockedDeviceCount}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};
