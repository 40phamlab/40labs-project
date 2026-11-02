import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { AuthShell } from './shell/AuthShell';
import { REGISTRATION_STEPS } from './registration/steps.config';
import { useRegistrationStore } from './store/registrationSlice';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { t, type TranslationKey } from '@40labs/i18n';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { BusinessPhoneStep } from './steps/BusinessPhoneStep';
import { SizeStep } from './steps/SizeStep';
import { PlaceStep } from './steps/PlaceStep';
import { PaymentsStep } from './steps/PaymentsStep';
import { OwnerDetailsStep } from './steps/OwnerDetailsStep';
import { OwnerVerifyStep } from './steps/OwnerVerifyStep';
import { TermsStep } from './steps/TermsStep';
import { AccessStep } from './steps/AccessStep';

interface RegistrationWizardProps {
  onComplete: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onComplete }) => {
  const { language } = useLanguageStore();
  const resetDraft = useRegistrationStore((s) => s.resetDraft);

  const [currentStep, setCurrentStep] = React.useState<number>(0);
  const [completed, setCompleted] = React.useState<Set<number>>(new Set());
  const [isStepValid, setIsStepValid] = React.useState<boolean>(false);
  const [isCompleted, setIsCompleted] = React.useState<boolean>(false);
  const [commitData, setCommitData] = React.useState<{ businessId: string; recoveryCodes?: string[] } | null>(null);

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
      setIsStepValid(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(true); // previously visited steps considered valid
    }
  };

  const handleSkip = () => {
    if (REGISTRATION_STEPS[currentStep].skippable) {
      const nextCompleted = new Set(completed);
      nextCompleted.add(currentStep);
      setCompleted(nextCompleted);
      setCurrentStep(currentStep + 1);
      setIsStepValid(false);
    }
  };

  const handleStepClick = (index: number) => {
    if (completed.has(index) || index < currentStep) {
      setCurrentStep(index);
      setIsStepValid(true);
    }
  };

  const renderCurrentStepContent = () => {
    if (isCompleted && commitData) {
      return (
        <AccessStep
          businessId={commitData.businessId}
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
            <BusinessInfoStep onValidChange={setIsStepValid} />
            <BusinessPhoneStep onValidChange={setIsStepValid} />
          </div>
        );
      case 'type':
        return <SizeStep onValidChange={setIsStepValid} />;
      case 'location':
        return <PlaceStep onValidChange={setIsStepValid} />;
      case 'payments':
        return <PaymentsStep onValidChange={setIsStepValid} />;
      case 'owner':
        return (
          <div className="space-y-6">
            <OwnerDetailsStep onValidChange={setIsStepValid} />
            <OwnerVerifyStep onValidChange={setIsStepValid} />
          </div>
        );
      case 'terms':
        return (
          <TermsStep
            onValidChange={setIsStepValid}
            onCommitSuccess={(res) => {
              const bizId = res.business_id || res.businessId || 'AFYA-TEST01';
              setCommitData({
                businessId: bizId,
                recoveryCodes: res.recoveryCodes || ['ABCDE-12345', 'FGHIJ-67890', 'KLMNO-11223', 'PQRST-44556'],
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
