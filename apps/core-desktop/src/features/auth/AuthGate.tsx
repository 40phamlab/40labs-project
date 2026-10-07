import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, type AuthStatusResponse } from '../../api/authApi';
import { LandingScreen } from './landing/LandingScreen';
import { RegistrationWizard } from './RegistrationWizard';
import { LoginScreen } from './LoginScreen';
import { LockScreen } from './LockScreen';
import { CreatePinScreen } from './CreatePinScreen';
import { ForcedPasswordChangeScreen } from './ForcedPasswordChangeScreen';
import { SetupWizardScreen } from './SetupWizardScreen';
import { StepUpModal } from './components/StepUpModal';
import { useAuthStore } from '../../stores/useAuthStore';
import { TitleBar } from '../../components/TitleBar';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [showWizard, setShowWizard] = React.useState(false);

  const { data: status, isLoading, refetch } = useQuery<AuthStatusResponse>({
    queryKey: ['auth_status'],
    queryFn: () => authApi.status(),
    refetchInterval: 5000,
  });

  const isLockedStore = useAuthStore((s) => s.isLocked);
  const setLockedStore = useAuthStore((s) => s.setLocked);

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
          onUnlockSuccess={() => {
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

  // 7. owner_first_login -> SetupWizard
  if (status.business.onboarding_state === 'owner_first_login') {
    return renderTitleBarWrapper(
      <SetupWizardScreen onSetupComplete={() => refetch()} />
    );
  }

  // 8. Otherwise -> App shell with global StepUpModal
  return (
    <>
      {children}
      <StepUpModal />
    </>
  );
};
