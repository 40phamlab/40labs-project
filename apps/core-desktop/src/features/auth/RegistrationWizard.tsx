import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { AuthShell } from './shell/AuthShell';
import { REGISTRATION_STEPS } from './registration/steps.config';
import { useRegistrationStore } from './store/registrationSlice';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { BusinessPhoneStep } from './steps/BusinessPhoneStep';
import { SizeStep } from './steps/SizeStep';
import { PlaceStep } from './steps/PlaceStep';
import { PaymentsStep } from './steps/PaymentsStep';
import { OwnerDetailsStep } from './steps/OwnerDetailsStep';
import { OwnerVerifyStep } from './steps/OwnerVerifyStep';
import { TermsStep } from './steps/TermsStep';
import { AccessStep } from './steps/AccessStep';
import { AccountStep, type RegistrationCredentials } from './steps/AccountStep';

interface RegistrationWizardProps {
  onComplete: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onComplete }) => {
  const { language } = useLanguageStore();
  const resetDraft = useRegistrationStore((s) => s.resetDraft);

  const [currentStep, setCurrentStep] = React.useState<number>(0);
  const [completed, setCompleted] = React.useState<Set<number>>(new Set());
  const [singleStepValidity, setSingleStepValidity] = React.useState<Record<string, boolean>>({});
  const [businessInfoValid, setBusinessInfoValid] = React.useState(false);
  const [businessPhoneValid, setBusinessPhoneValid] = React.useState(false);
  const [ownerDetailsValid, setOwnerDetailsValid] = React.useState(false);
  const [ownerPhoneVerified, setOwnerPhoneVerified] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState<boolean>(false);
  const [verification, setVerification] = React.useState<{ token: string; phone: string } | null>(null);
  const [credentials, setCredentials] = React.useState<RegistrationCredentials>({ username: '', password: '' });
  const [commitData, setCommitData] = React.useState<{
    businessId: string;
    credentials: RegistrationCredentials;
    recoveryCodes: string[];
  } | null>(null);

  const handleOwnerVerified = React.useCallback((value: { token: string; phone: string } | null) => {
    setVerification(value);
  }, []);
  const setCurrentStepValid = React.useCallback((valid: boolean) => {
    const stepId = REGISTRATION_STEPS[currentStep]?.id;
    if (stepId) setSingleStepValidity((current) => ({ ...current, [stepId]: valid }));
  }, [currentStep]);
  const currentStepId = REGISTRATION_STEPS[currentStep]?.id;
  const isStepValid = currentStepId === 'business'
    ? businessInfoValid && businessPhoneValid
    : currentStepId === 'owner'
      ? ownerDetailsValid && ownerPhoneVerified
      : Boolean(currentStepId && singleStepValidity[currentStepId]);

  // Map REGISTRATION_STEPS to StepDef for HexStepper
  const stepDefs = REGISTRATION_STEPS.map((step) => ({
    id: step.id,
    title: t(step.i18n, language),
  }));

  const handleNext = () => {
    if (currentStep < REGISTRATION_STEPS.length - 1) {
      const nextCompleted = new Set(completed);
      nextCompleted.add(currentStep);
      setCompleted(nextCompleted);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (REGISTRATION_STEPS[currentStep].skippable) {
      const nextCompleted = new Set(completed);
      nextCompleted.add(currentStep);
      setCompleted(nextCompleted);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (completed.has(index) || index < currentStep) {
      setCurrentStep(index);
    }
  };

  const renderCurrentStepContent = () => {
    if (isCompleted && commitData) {
      return (
        <AccessStep
          businessId={commitData.businessId}
          credentials={commitData.credentials}
          recoveryCodes={commitData.recoveryCodes}
          onCompleteSignIn={() => {
            resetDraft();
            onComplete();
          }}
        />
      );
    }

    const currentStepConfig = REGISTRATION_STEPS[currentStep];

    switch (currentStepConfig.id) {
      case 'business':
        return (
          <div className="space-y-6">
            <BusinessInfoStep onValidChange={setBusinessInfoValid} />
            <BusinessPhoneStep onValidChange={setBusinessPhoneValid} />
          </div>
        );
      case 'type':
        return <SizeStep onValidChange={setCurrentStepValid} />;
      case 'location':
        return <PlaceStep onValidChange={setCurrentStepValid} />;
      case 'payments':
        return <PaymentsStep onValidChange={setCurrentStepValid} />;
      case 'owner':
        return (
          <div className="space-y-6">
            <OwnerDetailsStep onValidChange={setOwnerDetailsValid} />
            <OwnerVerifyStep
              onValidChange={setOwnerPhoneVerified}
              onVerified={handleOwnerVerified}
            />
          </div>
        );
      case 'account':
        return <AccountStep value={credentials} onChange={setCredentials} onValidChange={setCurrentStepValid} />;
      case 'terms':
        return (
          <TermsStep
            onValidChange={setCurrentStepValid}
            verification={verification}
            credentials={credentials}
            onRegistrationStored={() => {
              resetDraft();
              onComplete();
            }}
            onCommitSuccess={(res) => {
              setCommitData({
                businessId: res.businessId,
                credentials,
                recoveryCodes: res.recoveryCodes,
              });
              setIsCompleted(true);
              const nextCompleted = new Set(completed);
              nextCompleted.add(currentStep);
              setCompleted(nextCompleted);
            }}
          />
        );
      default:
        return null;
    }
  };

  const currentStepTitle = isCompleted
    ? 'Imekamilika'
    : t(REGISTRATION_STEPS[currentStep].i18n, language);

  const isSkippable = !isCompleted && REGISTRATION_STEPS[currentStep]?.skippable;
  const isLastStep = !isCompleted && currentStep === REGISTRATION_STEPS.length - 1;

  return (
    <AuthShell
      rail="stepper"
      steps={stepDefs}
      currentStep={currentStep}
      completed={completed}
      onStepClick={handleStepClick}
    >
      <div className="space-y-6">
        {/* Step Title Only (no helper text, no preview chips) */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-sora text-foreground">
            {currentStepTitle}
          </h2>
        </div>

        {/* Step Content */}
        <div className="py-2">
          {renderCurrentStepContent()}
        </div>

        {/* Footer Navigation */}
        {!isCompleted && (
          <div className="flex items-center space-x-3 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="neutral"
              className="flex-1 h-[44px]"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Rudi
            </Button>
            {isSkippable && (
              <Button
                type="button"
                variant="neutral"
                className="flex-1 h-[44px]"
                onClick={handleSkip}
              >
                Ruka
              </Button>
            )}
            {!isLastStep ? (
              <Button
                type="button"
                className="flex-1 h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                onClick={handleNext}
                disabled={!isStepValid}
              >
                Endelea
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </AuthShell>
  );
};
