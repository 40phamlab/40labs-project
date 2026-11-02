import * as React from 'react';
import { useDevices } from '../../../hooks/useDevices';
import { usersApi } from '../../../api/usersApi';
import { authApi } from '../../../api/authApi';
import { SecurityOverview } from './security/SecurityOverview';
import { LoginAuthenticationSection } from './security/LoginAuthenticationSection';
import { SessionDeviceManagementSection } from './security/SessionDeviceManagementSection';
import { AccessControlSection } from './security/AccessControlSection';
import { SessionLockSection } from './security/SessionLockSection';
import { AccountRecoverySection } from './security/AccountRecoverySection';
import { SecurityActivityAuditLog } from './security/SecurityActivityAuditLog';
import type { User } from '@40labs/types';

interface SecurityPanelProps {
  onNavigateToDevices?: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = () => {
  const { devices } = useDevices();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = React.useState<User[]>([]);
  const [idleMinutes, setIdleMinutes] = React.useState<number>(5);
  const [isOnboardingSetupComplete, setIsOnboardingSetupComplete] = React.useState<boolean>(true);
  const [totpStatus, setTotpStatus] = React.useState<string>('not_configured');

  const loadSecurityData = React.useCallback(async () => {
    try {
      const allUsers = await usersApi.list();
      setBlockedUsers(allUsers.filter((u) => !u.active));
    } catch {
      setBlockedUsers([]);
    }

    try {
      const statusRes = await authApi.status();
      const minutes = statusRes.business?.idle_lock_minutes || statusRes.idleLockMinutes || 5;
      setIdleMinutes(minutes);
      const state = statusRes.business?.onboarding_state || statusRes.onboardingState;
      setIsOnboardingSetupComplete(state === 'setup_complete' || !state);
    } catch {
      // defaults
    }

    try {
      const totpRes = await authApi.totpStatus();
      setTotpStatus(totpRes.status);
    } catch {
      setTotpStatus('not_configured');
    }
  }, []);

  React.useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const activeDeviceCount = devices.filter((d) => d.status === 'active').length;
  const is2FaEnabled = totpStatus === 'enabled';

  const auditEvents = [
    { id: 'evt_1', event: 'Password Changed', user: 'Admin User', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), ip: 'Local', status: 'success' as const },
    { id: 'evt_2', event: 'Successful Login', user: 'Admin User', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), ip: 'Local', status: 'success' as const },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl">
      {/* 1. Security Overview */}
      <SecurityOverview
        activeDeviceCount={activeDeviceCount}
        is2FaEnabled={is2FaEnabled}
        lastActivityText={auditEvents[0]?.timestamp ? new Date(auditEvents[0].timestamp).toLocaleString() : 'No recent activity'}
      />

      {/* 2. Login & Authentication */}
      <LoginAuthenticationSection setToast={setToastMessage} />

      {/* 3. Session & Device Management */}
      <SessionDeviceManagementSection setToast={setToastMessage} />

      {/* 4. Access Control & Blocked Users */}
      <AccessControlSection
        blockedUsers={blockedUsers}
        onRefresh={loadSecurityData}
        setToast={setToastMessage}
      />

      {/* 5. Session Lock & SUDO Protection */}
      <SessionLockSection
        initialIdleMinutes={idleMinutes}
        isOnboardingSetupComplete={isOnboardingSetupComplete}
        setToast={setToastMessage}
      />

      {/* 6. Account Recovery */}
      <AccountRecoverySection setToast={setToastMessage} />

      {/* 7. Security Activity Audit Log */}
      <SecurityActivityAuditLog events={auditEvents} />

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
