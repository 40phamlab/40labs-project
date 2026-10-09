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
import { PublicTitleBar } from '../../components/PublicTitleBar';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [showWizard, setShowWizard] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: status, isLoading, error, refetch } = useQuery<AuthStatusResponse>({
    queryKey: ['auth_status'],
    queryFn: () => authApi.status(),
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
          queryClient.invalidateQueries({ queryKey: ['auth_status'] });
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
  }, [status?.session, isLockedStore, idleMinutes, queryClient, setLockedStore]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <PublicTitleBar />
        <div className="flex-1 flex items-center justify-center bg-background text-foreground font-sora">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Inapakia...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <PublicTitleBar />
        <div className="flex-1 flex items-center justify-center bg-background text-foreground font-sora p-6">
          <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 text-center shadow-lg">
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-2">Hitilafu ya Mfumo</h2>
            <p className="text-sm text-text-muted mb-4">Imeshindwa kuunganisha na seva ya uthibitisho au kupata hali ya mfumo.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-action-primary text-text-inverse rounded-md hover:bg-action-primary-hover transition-colors"
            >
              Jaribu Tena
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTitleBarWrapper = (content: React.ReactNode) => (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <PublicTitleBar />
      <div className="flex-1 overflow-y-auto">{content}</div>
    </div>
  );

  // 1. Session locked (backend or store) -> Render ONLY LockScreen, NEVER {children}
  if (status.session?.locked || isLockedStore) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <PublicTitleBar />
        <div className="flex-1 overflow-y-auto">
          <LockScreen
            displayName={status.session?.displayName}
            businessName={status.business?.name}
            onUnlockSuccess={() => {
              setLockedStore(false);
              queryClient.invalidateQueries({ queryKey: ['auth_status'] });
            }}
            onSwitchUser={() => {
              setLockedStore(false);
              queryClient.invalidateQueries({ queryKey: ['auth_status'] });
            }}
          />
        </div>
      </div>
    );
  }

  // 2. No business / device unbound -> LandingScreen -> Registration Wizard
  if (!status.deviceBound || !status.business) {
    if (!showWizard) {
      return renderTitleBarWrapper(<LandingScreen onGetStarted={() => setShowWizard(true)} />);
    }
    return renderTitleBarWrapper(<RegistrationWizard onComplete={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })} />);
  }

  // 3. No session -> Login
  if (!status.session) {
    return renderTitleBarWrapper(
      <LoginScreen
        businessName={status.business.name}
        onLoginSuccess={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })}
      />
    );
  }

  // 4. must_change_credentials -> ForcedPasswordChange
  if (status.session.mustChangeCredentials) {
    return renderTitleBarWrapper(
      <ForcedPasswordChangeScreen onPasswordChanged={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })} />
    );
  }

  // 5. PIN not set -> CreatePin
  if (!status.session.pinSet) {
    return renderTitleBarWrapper(
      <CreatePinScreen onPinCreated={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })} />
    );
  }

  // 6. SUDO with zero active recovery codes -> RecoveryCodesScreen
  if (status.session.role === 'sudo' && !status.session.hasRecoveryCodes) {
    return renderTitleBarWrapper(
      <RecoveryCodesScreen onComplete={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })} />
    );
  }

  // 7. owner_first_login -> SetupWizard
  if (status.business.onboarding_state === 'owner_first_login') {
    return renderTitleBarWrapper(
      <SetupWizardScreen onSetupComplete={() => queryClient.invalidateQueries({ queryKey: ['auth_status'] })} />
    );
  }

  // 8. Otherwise -> Fully authenticated & setup complete: App shell wrapped in StepUpProvider
  return (
    <StepUpProvider>
      {children}
    </StepUpProvider>
  );
};
