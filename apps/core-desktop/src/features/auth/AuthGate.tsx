import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthStatusResponse } from '../../api/authApi';
import { parseAuthError } from '../../api/authErrors';
import { LandingScreen } from './landing/LandingScreen';
import { RegistrationWizard } from './RegistrationWizard';
import { LoginScreen } from './login/LoginScreen';
import { LockScreen } from './lock/LockScreen';
import { CreatePinScreen } from './pin/CreatePinScreen';
import { ForcedPasswordChangeScreen } from './credentials/ForcedPasswordChangeScreen';
import { RecoveryCodesScreen } from './recovery/RecoveryCodesScreen';
import { SetupWizardScreen } from './SetupWizardScreen';
import { StepUpProvider } from './stepup/StepUpProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { TitleBar } from '../../components/TitleBar';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [showWizard, setShowWizard] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: status, isLoading, refetch } = useQuery<AuthStatusResponse>({
    queryKey: ['auth_status'],
    queryFn: () => authApi.status(),
    refetchInterval: 5000,
  });

  const isLockedStore = useAuthStore((s) => s.isLocked);
  const setLockedStore = useAuthStore((s) => s.setLocked);

  // Global query cache error listener
  React.useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.action.type === 'error') {
        const error = event.action.error;
        const parsed = parseAuthError(error);
        if (
          parsed.code === 'SESSION_LOCKED' ||
          parsed.code === 'SESSION_REQUIRED' ||
          parsed.code === 'PIN_SETUP_REQUIRED'
        ) {
          if (parsed.code === 'SESSION_LOCKED') {
            setLockedStore(true);
          }
          queryClient.invalidateQueries({ queryKey: ['auth_status'] });
        }
      }
    });
    return () => unsubscribe();
  }, [queryClient, setLockedStore]);

  // Idle lock timer
  const idleMinutes = status?.business?.idle_lock_minutes || status?.idleLockMinutes || 5;
  const lastActivityRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (!status?.session || status.session.locked || isLockedStore) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    const interval = setInterval(async () => {
      const idleMs = Date.now() - lastActivityRef.current;
      const limitMs = idleMinutes * 60 * 1000;
      if (idleMs > limitMs) {
        try {
          await authApi.lock();
          setLockedStore(true);
          refetch();
        } catch {
          // ignore
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, [status?.session, isLockedStore, idleMinutes, refetch, setLockedStore]);

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground font-sora">
        <span>Inapakia...</span>
      </div>
    );
  }

  const renderTitleBarWrapper = (content: React.ReactNode) => (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <div className="flex items-center justify-between w-full h-10 bg-top-chrome border-b border-border select-none drag-region" data-tauri-drag-region>
        <div className="flex-1 min-w-0 h-full" />
        <div className="no-drag shrink-0 h-full" data-tauri-drag-region="false">
          <TitleBar />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{content}</div>
    </div>
  );

  // 1. No business / device unbound -> LandingScreen -> Registration Wizard
  if (!status.deviceBound || !status.business) {
    if (!showWizard) {
      return renderTitleBarWrapper(<LandingScreen onGetStarted={() => setShowWizard(true)} />);
    }
    return renderTitleBarWrapper(<RegistrationWizard onComplete={() => refetch()} />);
  }

  // 2. No session -> Login
  if (!status.session) {
    return renderTitleBarWrapper(
      <LoginScreen
        businessName={status.business.name}
        onLoginSuccess={() => refetch()}
      />
    );
  }

  // 3. Session locked (backend or store)
  if (status.session.locked || isLockedStore) {
    return (
      <>
        {children}
        <LockScreen
          displayName={status.session.displayName}
          businessName={status.business.name}
          onUnlockSuccess={() => {
            setLockedStore(false);
            refetch();
          }}
          onSwitchUser={() => {
            setLockedStore(false);
            refetch();
          }}
        />
      </>
    );
  }

  // 4. must_change_credentials -> ForcedPasswordChange
  if (status.session.mustChangeCredentials) {
    return renderTitleBarWrapper(
      <ForcedPasswordChangeScreen onPasswordChanged={() => refetch()} />
    );
  }

  // 5. PIN not set -> CreatePin
  if (!status.session.pinSet) {
    return renderTitleBarWrapper(
      <CreatePinScreen onPinCreated={() => refetch()} />
    );
  }

  // 6. SUDO with zero active recovery codes -> RecoveryCodesScreen
  if (status.session.role === 'sudo' && !status.session.hasRecoveryCodes) {
    return renderTitleBarWrapper(
      <RecoveryCodesScreen onComplete={() => refetch()} />
    );
  }

  // 7. owner_first_login -> SetupWizard
  if (status.business.onboarding_state === 'owner_first_login') {
    return renderTitleBarWrapper(
      <SetupWizardScreen onSetupComplete={() => refetch()} />
    );
  }

  // 8. Otherwise -> App shell wrapped in StepUpProvider
  return (
    <StepUpProvider>
      {children}
    </StepUpProvider>
  );
};
