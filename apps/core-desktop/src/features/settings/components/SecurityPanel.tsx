import * as React from 'react';
import { Panel, Button, Field, FieldLabel, PasswordInput } from '@40labs/ui-components';
import { Lock, Key, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import { useDevices } from '../../../hooks/useDevices';
import { auditApi } from '../../../api';
import { CURRENT_USER_ID } from '../../../devData/constants';

interface SecurityPanelProps {
  onNavigateToDevices: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ onNavigateToDevices }) => {
  const { changePin, changePassword, isChangingPin, isChangingPassword } = useUsers();
  const { devices } = useDevices();

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
    if (pinForm.newPin.length < 4) {
      setPinError('New PIN must be at least 4 digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    try {
      // Write audit log entry first
      await auditApi.recordEntry({
        action: 'pin_change',
        performed_by_user_id: CURRENT_USER_ID,
        target_entity_type: 'User',
        target_entity_id: CURRENT_USER_ID,
        metadata: { timestamp: new Date().toISOString() },
      });

      await changePin(pinForm.currentPin, pinForm.newPin);
      setPinSuccess(true);
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to update PIN.');
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
    if (passForm.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      // Write audit log entry first
      await auditApi.recordEntry({
        action: 'password_change',
        performed_by_user_id: CURRENT_USER_ID,
        target_entity_type: 'User',
        target_entity_id: CURRENT_USER_ID,
        metadata: { timestamp: new Date().toISOString() },
      });

      await changePassword(passForm.currentPassword, passForm.newPassword);
      setPassSuccess(true);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Failed to update password.');
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
              <h3 className="text-sm font-bold text-text-primary">Change Master PIN</h3>
              <p className="text-[11px] text-text-muted">Used for supervisor overrides and point-of-sale authorizations.</p>
            </div>
          </div>

          {pinSuccess && (
            <div className="p-3 bg-success/10 text-success text-xs rounded-card flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Master PIN successfully updated!</span>
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
                onChange={(e) => setPinForm((p) => ({ ...p, currentPin: e.target.value }))}
                placeholder="Current PIN"
              />
            </Field>

            <Field>
              <FieldLabel required>New PIN</FieldLabel>
              <PasswordInput
                maxLength={6}
                value={pinForm.newPin}
                onChange={(e) => setPinForm((p) => ({ ...p, newPin: e.target.value }))}
                placeholder="New 4-6 digit PIN"
              />
            </Field>

            <Field>
              <FieldLabel required>Confirm New PIN</FieldLabel>
              <PasswordInput
                maxLength={6}
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm((p) => ({ ...p, confirmPin: e.target.value }))}
                placeholder="Re-enter new PIN"
              />
            </Field>

            <Button
              type="submit"
              intent="primary"
              size="sm"
              className="w-full"
              disabled={isChangingPin || !pinForm.currentPin || !pinForm.newPin}
            >
              {isChangingPin ? 'Updating PIN...' : 'Update Master PIN'}
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
              <h3 className="text-sm font-bold text-text-primary">Change Account Password</h3>
              <p className="text-[11px] text-text-muted">Used for desktop application login and administrative access.</p>
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
                onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Current Password"
              />
            </Field>

            <Field>
              <FieldLabel required>New Password</FieldLabel>
              <PasswordInput
                value={passForm.newPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="New Password (min 6 chars)"
              />
            </Field>

            <Field>
              <FieldLabel required>Confirm New Password</FieldLabel>
              <PasswordInput
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
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

      {/* Card 3: Paired Devices Summary */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Smartphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Paired Devices Summary</h3>
              <p className="text-xs text-text-muted">
                Quick status overview of paired Orbit Worker hardware terminals.
              </p>
            </div>
          </div>

          <Button
            variant="neutral"
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
