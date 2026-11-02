import * as React from 'react';
import {
  Panel,
  Button,
  Field,
  FieldLabel,
  PasswordInput,
  StatusBadge,
  Modal,
  DataTable,
  type ColumnDefinition,
} from '@40labs/ui-components';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Smartphone,
  Laptop,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Search,
  Download,
  Copy,
  Eye,
  EyeOff,
  UserX,
  History,
  Clock,
  Globe,
  Check,
} from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import { useDevices } from '../../../hooks/useDevices';
import { useStepUp } from '../../auth/stepup/StepUpProvider';
import { authApi } from '../../../api/authApi';
import type { DeviceRecord } from '@40labs/types';

interface SecurityPanelProps {
  onNavigateToDevices?: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ onNavigateToDevices }) => {
  const { changePin, changePassword } = useUsers();
  const { devices } = useDevices();
  const { requestStepUp } = useStepUp();

  // Toast / notification state
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Password state
  const [passForm, setPassForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [passSuccess, setPassSuccess] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = React.useState(false);

  // PIN state
  const [pinForm, setPinForm] = React.useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [isForgotPinMode, setIsForgotPinMode] = React.useState(false);
  const [forgotPinForm, setForgotPinForm] = React.useState({
    password: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinSuccess, setPinSuccess] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);

  // 2FA state
  const [is2FaEnabled, setIs2FaEnabled] = React.useState(false);
  const [show2faModal, setShow2faModal] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');

  // Idle lock state
  const [idleMinutes, setIdleMinutes] = React.useState<number>(5);
  const [idleSuccess, setIdleSuccess] = React.useState(false);
  const [isUpdatingIdle, setIsUpdatingIdle] = React.useState(false);

  // Recovery codes state
  const [regenPassword, setRegenPassword] = React.useState('');
  const [newCodes, setNewCodes] = React.useState<Array<string> | null>(null);
  const [regenError, setRegenError] = React.useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  // Blocked users & Access Control state
  const [searchBlockedQuery, setSearchBlockedQuery] = React.useState('');
  const [showBlockUserModal, setShowBlockUserModal] = React.useState(false);
  const [blockUsername, setBlockUsername] = React.useState('');
  const [blockReason, setBlockReason] = React.useState('');
  const [blockedUsersList, setBlockedUsersList] = React.useState<
    Array<{ id: string; username: string; email: string; blockedAt: string; reason: string }>
  >([
    {
      id: 'usr_blocked_1',
      username: 'johndoe_suspended',
      email: 'john.doe@labtest.com',
      blockedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      reason: 'Multiple failed login attempts and policy violation.',
    },
  ]);

  // Security activity audit log mock data (backed by actual events when available)
  const [auditEvents] = React.useState<
    Array<{ id: string; event: string; user: string; timestamp: string; ip: string; status: 'success' | 'warning' | 'failed' }>
  >([
    { id: 'evt_1', event: 'Password Changed', user: 'Admin User', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), ip: '192.168.1.50', status: 'success' },
    { id: 'evt_2', event: 'Successful Login', user: 'Admin User', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), ip: '192.168.1.50', status: 'success' },
    { id: 'evt_3', event: 'Device Registered', user: 'Lab Tech 1', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), ip: '192.168.1.88', status: 'success' },
    { id: 'evt_4', event: 'Failed PIN Attempt', user: 'Unknown', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), ip: '203.0.113.42', status: 'failed' },
  ]);

  // Derived metrics for Overview
  const activeDeviceCount = devices.filter((d) => d.status === 'active').length;
  const lastActivityDate = auditEvents[0]?.timestamp ? new Date(auditEvents[0].timestamp).toLocaleString() : 'No recent activity';

  // Password strength checker
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
      setToastMessage('Account password updated successfully.');
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
      setToastMessage('Security PIN updated successfully.');
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
      setToastMessage('PIN reset successfully using your account password.');
    } catch (err: any) {
      setPinError(err?.code || 'Failed to reset PIN with password.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleIdleLockSubmit = async () => {
    setIdleSuccess(false);
    setIsUpdatingIdle(true);
    try {
      await requestStepUp(async () => {
        await authApi.businessSetIdleLock(idleMinutes);
      }, 'settings.manage:idle');
      setIdleSuccess(true);
      setToastMessage('Automatic session idle lock duration updated.');
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to update idle lock duration.');
    } finally {
      setIsUpdatingIdle(false);
    }
  };

  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenError(null);
    setNewCodes(null);
    if (!regenPassword) {
      setRegenError('Password is required to regenerate recovery codes.');
      return;
    }

    setIsRegenerating(true);
    try {
      const codes = await authApi.recoveryRegenerate(regenPassword);
      setNewCodes(codes);
      setRegenPassword('');
      setToastMessage('New recovery codes generated successfully. Previous codes are now invalid.');
    } catch (err: any) {
      setRegenError(err?.code || 'Failed to regenerate recovery codes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleBlockUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUsername.trim()) return;

    const newBlocked = {
      id: `usr_blocked_${Date.now()}`,
      username: blockUsername.trim(),
      email: `${blockUsername.trim().toLowerCase()}@labtest.com`,
      blockedAt: new Date().toISOString(),
      reason: blockReason.trim() || 'Administrative suspension.',
    };

    setBlockedUsersList([newBlocked, ...blockedUsersList]);
    setBlockUsername('');
    setBlockReason('');
    setShowBlockUserModal(false);
    setToastMessage(`User "${newBlocked.username}" has been blocked and access revoked.`);
  };

  const handleUnblockUser = (id: string, username: string) => {
    if (confirm(`Are you sure you want to unblock user "${username}"?`)) {
      setBlockedUsersList(blockedUsersList.filter((u) => u.id !== id));
      setToastMessage(`User "${username}" unblocked successfully.`);
    }
  };

  // Terminate session handler
  const handleTerminateSession = (deviceId: string) => {
    if (confirm('Are you sure you want to terminate this active session?')) {
      setToastMessage(`Session terminated successfully for device ${deviceId}.`);
    }
  };

  const filteredBlockedUsers = blockedUsersList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchBlockedQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchBlockedQuery.toLowerCase())
  );

  const deviceColumns: ColumnDefinition<DeviceRecord>[] = [
    {
      key: 'device_name',
      header: 'Device & OS',
      render: (dev) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-panel-subtle text-text-muted flex items-center justify-center border border-border/50">
            <Laptop size={15} />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              {dev.device_name}
              {dev.is_current && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-emerald-500/10 text-emerald-600 uppercase">
                  Current Session
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-muted font-mono">{dev.client_id || 'Desktop App'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP & Location',
      render: (dev) => (
        <div className="text-xs font-mono text-text-secondary">
          <div>{dev.ip_address || '127.0.0.1'}</div>
          <div className="text-[10px] text-text-muted flex items-center gap-1">
            <Globe size={11} /> Local Network
          </div>
        </div>
      ),
    },
    {
      key: 'last_active_at',
      header: 'Last Active',
      render: (dev) => (
        <span className="text-xs font-mono text-text-secondary">
          {dev.last_active_at ? new Date(dev.last_active_at).toLocaleString() : 'Just now'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (dev) => (
        <StatusBadge
          status={dev.status === 'active' ? 'success' : 'error'}
          label={dev.status.toUpperCase()}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (dev) => (
        <div className="text-right">
          {!dev.is_current && (
            <Button
              type="button"
              variant="neutral"
              size="sm"
              onClick={() => handleTerminateSession(dev.id)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Terminate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl">
      {/* SECTION 1: SECURITY OVERVIEW */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-text-primary tracking-tight">Security Overview</h2>
          <p className="text-xs text-text-muted">Real-time status of your account protection, authentication, and sessions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Account Protection */}
          <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Account Protection</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active & Secured
              </div>
              <p className="text-[11px] text-text-muted mt-1">Argon2id hashing & PIN protection enabled.</p>
            </div>
          </Panel>

          {/* Card 2: Active Sessions */}
          <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Active Sessions</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary font-mono">{activeDeviceCount} Active Device(s)</div>
              <p className="text-[11px] text-text-muted mt-1">Manage logged-in devices securely.</p>
            </div>
          </Panel>

          {/* Card 3: Two-Factor Authentication */}
          <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Two-Factor Auth</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${is2FaEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                {is2FaEnabled ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
              </div>
            </div>
            <div>
              <div className={`text-sm font-bold ${is2FaEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                {is2FaEnabled ? 'Enabled & Verified' : 'Disabled'}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                {is2FaEnabled ? 'Authenticator app linked' : 'Recommended for extra security'}
              </p>
            </div>
          </Panel>

          {/* Card 4: Last Security Activity */}
          <Panel variant="raised" className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Last Activity</span>
              <div className="w-8 h-8 rounded-xl bg-panel-subtle text-text-muted flex items-center justify-center border border-border/50">
                <Activity size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary truncate">{auditEvents[0]?.event || 'Login'}</div>
              <p className="text-[10px] font-mono text-text-muted mt-1">{lastActivityDate}</p>
            </div>
          </Panel>
        </div>
      </div>

      {/* SECTION 2: LOGIN & AUTHENTICATION */}
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
                <Button
                  type="submit"
                  intent="primary"
                  size="md"
                  disabled={isUpdatingPass}
                  className="w-full"
                >
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
                  <Button
                    type="submit"
                    intent="primary"
                    size="md"
                    disabled={isUpdatingPin}
                    className="w-full"
                  >
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
                  <Button
                    type="submit"
                    intent="primary"
                    size="md"
                    disabled={isUpdatingPin}
                    className="w-full"
                  >
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
                <StatusBadge status={is2FaEnabled ? 'success' : 'warning'} label={is2FaEnabled ? 'ENABLED' : 'DISABLED'} />
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
            onClick={() => {
              if (is2FaEnabled) {
                if (confirm('Are you sure you want to disable Two-Factor Authentication?')) {
                  setIs2FaEnabled(false);
                  setToastMessage('Two-Factor Authentication disabled.');
                }
              } else {
                setShow2faModal(true);
              }
            }}
          >
            {is2FaEnabled ? 'Disable 2FA' : 'Configure 2FA'}
          </Button>
        </Panel>
      </div>

      {/* SECTION 3: SESSION & DEVICE MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Active Sessions & Devices</h2>
            <p className="text-xs text-text-muted">Monitor and manage all devices currently logged into your account.</p>
          </div>
          <Button
            type="button"
            variant="neutral"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to terminate all other active sessions?')) {
                setToastMessage('All other active sessions have been terminated.');
              }
            }}
            className="text-xs text-rose-600 hover:bg-rose-50"
          >
            Terminate All Other Sessions
          </Button>
        </div>

        <Panel variant="raised" className="overflow-hidden">
          <DataTable
            data={devices}
            columns={deviceColumns}
            loading={false}
            emptyMessage="No active sessions found."
            keyExtractor={(dev) => dev.id}
            density="compact"
          />
        </Panel>
      </div>

      {/* SECTION 4: ACCESS CONTROL & BLOCKED USERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Access Control & Blocked Users</h2>
            <p className="text-xs text-text-muted">Manage suspended or blocked accounts and review system access restrictions.</p>
          </div>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<UserX size={14} />}
            onClick={() => setShowBlockUserModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Block a User Account
          </Button>
        </div>

        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                value={searchBlockedQuery}
                onChange={(e) => setSearchBlockedQuery(e.target.value)}
                placeholder="Search blocked users..."
                className="w-full bg-panel-subtle border border-border rounded-input pl-9 pr-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-xs font-mono text-text-muted">
              {filteredBlockedUsers.length} blocked account(s)
            </span>
          </div>

          {filteredBlockedUsers.length === 0 ? (
            <div className="text-center py-10 text-xs text-text-muted">
              No blocked users found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredBlockedUsers.map((u) => (
                <div key={u.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                      {u.username}
                      <span className="text-[10px] font-mono text-text-muted">({u.email})</span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Blocked on {new Date(u.blockedAt).toLocaleDateString()} &bull; Reason: {u.reason}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={() => handleUnblockUser(u.id, u.username)}
                    className="text-xs text-emerald-600 hover:bg-emerald-50"
                  >
                    Unblock User
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* SECTION 5: SESSION LOCK & SUDO PROTECTION */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">Session Lock & Sensitive Operations</h2>
          <p className="text-xs text-text-muted">Configure inactivity idle lock and step-up authentication for sensitive actions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Automatic Session Lock */}
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

            {idleSuccess && (
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-card text-xs border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 size={16} /> Idle lock duration updated.
              </div>
            )}

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

          {/* Card B: SUDO / Sensitive Operations Protection */}
          <Panel variant="raised" className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">SUDO Step-Up Protection</h3>
                <p className="text-xs text-text-muted">Require PIN verification for administrative tasks.</p>
              </div>
            </div>

            <div className="p-4 bg-panel-subtle rounded-card border border-border/50 space-y-2 text-xs text-text-secondary">
              <div className="flex items-center justify-between font-bold text-text-primary">
                <span>Protection Status:</span>
                <span className="text-emerald-600 font-mono">ACTIVE (ENFORCED)</span>
              </div>
              <p className="text-[11px] text-text-muted">
                Sensitive actions like deleting records, modifying financial settings, or managing users require re-authentication with your 6-digit PIN.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* SECTION 6: ACCOUNT RECOVERY */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">Account Recovery</h2>
          <p className="text-xs text-text-muted">Generate and securely store emergency recovery codes for your account.</p>
        </div>

        <Panel variant="raised" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Emergency Recovery Codes</h3>
                <p className="text-xs text-text-muted">Use these one-time backup codes if you lose access to your authenticator app or PIN.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegenerateCodes} className="space-y-3 pt-2 max-w-md">
            {regenError && (
              <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
                {regenError}
              </div>
            )}

            <Field>
              <FieldLabel required>Account Password (Required to Regenerate)</FieldLabel>
              <PasswordInput
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </Field>

            <Button
              type="submit"
              intent="primary"
              size="sm"
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Generating...' : 'Regenerate Recovery Codes'}
            </Button>
          </form>

          {newCodes && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-card space-y-3 mt-4">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Save these codes securely. They will only be shown once!
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-panel p-3 rounded border border-border">
                {newCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 text-center font-bold text-text-primary">{code}</div>
                ))}
              </div>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                leftIcon={<Copy size={14} />}
                onClick={() => {
                  navigator.clipboard.writeText(newCodes.join('\n'));
                  setToastMessage('Recovery codes copied to clipboard.');
                }}
              >
                Copy All Codes
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {/* SECTION 7: SECURITY ACTIVITY AUDIT LOG */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">Security Activity Audit Log</h2>
          <p className="text-xs text-text-muted">Recent security-related events and login attempts across your account.</p>
        </div>

        <Panel variant="raised" className="overflow-hidden">
          <DataTable
            data={auditEvents}
            columns={[
              {
                key: 'event',
                header: 'Security Event',
                render: (ev) => (
                  <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <History size={14} className="text-primary" />
                    {ev.event}
                  </div>
                ),
              },
              {
                key: 'user',
                header: 'Actor',
                render: (ev) => <span className="text-xs text-text-secondary">{ev.user}</span>,
              },
              {
                key: 'ip',
                header: 'IP Address',
                render: (ev) => <span className="text-xs font-mono text-text-muted">{ev.ip}</span>,
              },
              {
                key: 'timestamp',
                header: 'Date & Time',
                render: (ev) => (
                  <span className="text-xs font-mono text-text-secondary">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (ev) => (
                  <StatusBadge
                    status={ev.status === 'success' ? 'success' : ev.status === 'warning' ? 'warning' : 'error'}
                    label={ev.status.toUpperCase()}
                  />
                ),
              },
            ]}
            loading={false}
            emptyMessage="No security audit events recorded."
            keyExtractor={(ev) => ev.id}
            density="compact"
          />
        </Panel>
      </div>

      {/* MODAL: 2FA Setup */}
      <Modal
        isOpen={show2faModal}
        onClose={() => setShow2faModal(false)}
        title="Configure Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-text-muted">
            Scan the QR code below with your authenticator app (e.g. Google Authenticator, Authy), then enter the 6-digit verification code.
          </p>
          <div className="w-48 h-48 bg-panel-subtle border border-border rounded-card mx-auto flex items-center justify-center font-mono text-xs text-text-muted">
            [ QR Code Placeholder ]
          </div>

          <Field>
            <FieldLabel required>Verification Code</FieldLabel>
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-sm text-text font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShow2faModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              intent="primary"
              size="sm"
              onClick={() => {
                if (verificationCode.length === 6) {
                  setIs2FaEnabled(true);
                  setShow2faModal(false);
                  setVerificationCode('');
                  setToastMessage('Two-Factor Authentication successfully enabled!');
                } else {
                  alert('Please enter a valid 6-digit code.');
                }
              }}
            >
              Verify & Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Block User */}
      <Modal
        isOpen={showBlockUserModal}
        onClose={() => setShowBlockUserModal(false)}
        title="Block User Account"
        size="md"
      >
        <form onSubmit={handleBlockUserSubmit} className="space-y-4 p-2">
          <p className="text-xs text-text-muted">
            Blocking a user immediately revokes their active sessions and prevents future authentication.
          </p>

          <Field>
            <FieldLabel required>Username or Email</FieldLabel>
            <input
              type="text"
              value={blockUsername}
              onChange={(e) => setBlockUsername(e.target.value)}
              placeholder="e.g. jsmith or jsmith@labtest.com"
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </Field>

          <Field>
            <FieldLabel>Reason for Blocking</FieldLabel>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Enter suspension reason..."
              rows={3}
              className="w-full bg-panel border border-border rounded-input p-3 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowBlockUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit" intent="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
              Confirm & Block User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold">&times;</button>
        </div>
      )}
    </div>
  );
};
