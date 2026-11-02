import * as React from 'react';
import { Panel, Button, Field, FieldLabel, PasswordInput, StatusBadge } from '@40labs/ui-components';
import { Key, Lock, Smartphone, CheckCircle2 } from 'lucide-react';
import { useUsers } from '../../../../hooks/useUsers';
import { authApi } from '../../../../api/authApi';
import { Setup2faModal } from './Setup2faModal';

interface LoginAuthenticationSectionProps {
  setToast: (msg: string) => void;
}

export const LoginAuthenticationSection: React.FC<LoginAuthenticationSectionProps> = ({ setToast }) => {
  const { changePin, changePassword } = useUsers();

  // Password state
  const [passForm, setPassForm] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passSuccess, setPassSuccess] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = React.useState(false);

  // PIN state
  const [pinForm, setPinForm] = React.useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [isForgotPinMode, setIsForgotPinMode] = React.useState(false);
  const [forgotPinForm, setForgotPinForm] = React.useState({ password: '', newPin: '', confirmPin: '' });
  const [pinSuccess, setPinSuccess] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);

  // 2FA state
  const [totpStatus, setTotpStatus] = React.useState<string>('not_configured');
  const [show2faModal, setShow2faModal] = React.useState(false);

  React.useEffect(() => {
    authApi.totpStatus()
      .then((res) => setTotpStatus(res.status))
      .catch(() => setTotpStatus('not_configured'));
  }, []);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-border' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score === 4) return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    if (score >= 2) return { score, label: 'Moderate', color: 'bg-amber-500' };
    return { score, label: 'Weak', color: 'bg-rose-500' };
  };

  const passStrength = getPasswordStrength(passForm.newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!passForm.currentPassword) {
      setPassError('Current password is required.');
      return;
    }
    if (passForm.newPassword.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      await changePassword(passForm.currentPassword, passForm.newPassword);
      setPassSuccess(true);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToast('Account password updated successfully.');
    } catch (err: any) {
      setPassError(err?.code || 'Failed to update password.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(false);

    if (!pinForm.currentPin) {
      setPinError('Current PIN is required.');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      setPinError('PIN must be exactly 6 digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      await changePin(pinForm.currentPin, pinForm.newPin);
      setPinSuccess(true);
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setToast('Security PIN updated successfully.');
    } catch (err: any) {
      setPinError(err?.code || 'Failed to update PIN.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleForgotPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(false);

    if (!forgotPinForm.password) {
      setPinError('Current account password is required.');
      return;
    }
    if (forgotPinForm.newPin.length !== 6) {
      setPinError('New PIN must be exactly 6 digits.');
      return;
    }
    if (forgotPinForm.newPin !== forgotPinForm.confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      await authApi.resetOwnPin(forgotPinForm.password, forgotPinForm.newPin);
      setPinSuccess(true);
      setIsForgotPinMode(false);
      setForgotPinForm({ password: '', newPin: '', confirmPin: '' });
      setToast('PIN reset successfully using your account password.');
    } catch (err: any) {
      setPinError(err?.code || 'Failed to reset PIN with password.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const is2FaEnabled = totpStatus === 'enabled';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text-primary tracking-tight">Login & Authentication</h2>
        <p className="text-xs text-text-muted">Manage your primary account password, security PIN, and two-factor authentication.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Change Account Password */}
        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Change Account Password</h3>
              <p className="text-xs text-text-muted">Use a strong, unique password to protect your account.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
            {passError && (
              <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-card text-xs border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 size={16} /> Password updated successfully.
              </div>
            )}

            <Field>
              <FieldLabel required>Current Password</FieldLabel>
              <PasswordInput
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                placeholder="Enter current password..."
              />
            </Field>

            <Field>
              <FieldLabel required>New Password</FieldLabel>
              <PasswordInput
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="At least 8 characters..."
              />
              {passForm.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Strength:</span>
                    <span className="font-bold uppercase text-text-primary">{passStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-panel-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passStrength.color}`}
                      style={{ width: `${(passStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel required>Confirm New Password</FieldLabel>
              <PasswordInput
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password..."
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" intent="primary" size="md" disabled={isUpdatingPass} className="w-full">
                {isUpdatingPass ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Panel>

        {/* Card B: Change Security PIN */}
        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {isForgotPinMode ? 'Reset Security PIN' : 'Change Security PIN'}
                </h3>
                <p className="text-xs text-text-muted">Protects sensitive operational actions.</p>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              onClick={() => {
                setIsForgotPinMode(!isForgotPinMode);
                setPinError(null);
                setPinSuccess(false);
              }}
            >
              {isForgotPinMode ? 'Use Current PIN' : 'Forgot PIN?'}
            </button>
          </div>

          {isForgotPinMode ? (
            <form onSubmit={handleForgotPinSubmit} className="space-y-3 pt-2">
              {pinError && (
                <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-card text-xs border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 size={16} /> PIN reset successfully.
                </div>
              )}

              <Field>
                <FieldLabel required>Account Password (Verification)</FieldLabel>
                <PasswordInput
                  value={forgotPinForm.password}
                  onChange={(e) => setForgotPinForm({ ...forgotPinForm, password: e.target.value })}
                  placeholder="Enter account password..."
                />
              </Field>

              <Field>
                <FieldLabel required>New 6-Digit PIN</FieldLabel>
                <input
                  type="password"
                  maxLength={6}
                  value={forgotPinForm.newPin}
                  onChange={(e) => setForgotPinForm({ ...forgotPinForm, newPin: e.target.value })}
                  placeholder="------"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              <Field>
                <FieldLabel required>Confirm New 6-Digit PIN</FieldLabel>
                <input
                  type="password"
                  maxLength={6}
                  value={forgotPinForm.confirmPin}
                  onChange={(e) => setForgotPinForm({ ...forgotPinForm, confirmPin: e.target.value })}
                  placeholder="------"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" intent="primary" size="md" disabled={isUpdatingPin} className="w-full">
                  {isUpdatingPin ? 'Resetting PIN...' : 'Reset PIN with Password'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
              {pinError && (
                <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-card text-xs border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 size={16} /> PIN updated successfully.
                </div>
              )}

              <Field>
                <FieldLabel required>Current 6-Digit PIN</FieldLabel>
                <input
                  type="password"
                  maxLength={6}
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                  placeholder="------"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              <Field>
                <FieldLabel required>New 6-Digit PIN</FieldLabel>
                <input
                  type="password"
                  maxLength={6}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                  placeholder="------"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              <Field>
                <FieldLabel required>Confirm New 6-Digit PIN</FieldLabel>
                <input
                  type="password"
                  maxLength={6}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  placeholder="------"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" intent="primary" size="md" disabled={isUpdatingPin} className="w-full">
                  {isUpdatingPin ? 'Updating PIN...' : 'Update PIN'}
                </Button>
              </div>
            </form>
          )}
        </Panel>
      </div>

      {/* Card C: Two-Factor Authentication */}
      <Panel variant="raised" className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">Two-Factor Authentication (2FA)</h3>
              <StatusBadge status={is2FaEnabled ? 'success' : 'warning'} label={is2FaEnabled ? 'ENABLED' : 'NOT CONFIGURED'} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Require an additional verification step using an authenticator app when signing in.
            </p>
          </div>
        </div>

        <Button
          type="button"
          intent={is2FaEnabled ? 'neutral' : 'primary'}
          size="md"
          disabled={!is2FaEnabled}
          onClick={() => {
            if (is2FaEnabled) {
              if (confirm('Are you sure you want to disable Two-Factor Authentication?')) {
                setTotpStatus('not_configured');
                setToast('Two-Factor Authentication disabled.');
              }
            } else {
              setShow2faModal(true);
            }
          }}
        >
          {is2FaEnabled ? 'Disable 2FA' : 'Not configured'}
        </Button>
      </Panel>

      <Setup2faModal
        isOpen={show2faModal}
        onClose={() => setShow2faModal(false)}
        onEnabled={() => {
          setTotpStatus('enabled');
          setToast('Two-Factor Authentication successfully enabled!');
        }}
      />
    </div>
  );
};
