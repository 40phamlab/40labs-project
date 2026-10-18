import * as React from 'react';
import { AuthShell } from './AuthShell';
import { type StepDef } from './HexStepper';
import { Button } from '@40labs/ui-components';

const MOCK_STEPS: StepDef[] = [
  { id: 1, title: 'Biashara' },
  { id: 2, title: 'Aina na Ukubwa' },
  { id: 3, title: 'Eneo' },
  { id: 4, title: 'Malipo' },
  { id: 5, title: 'Mmiliki na SMS OTP' },
  { id: 6, title: 'Akaunti' },
  { id: 7, title: 'Masharti' },
];

export const AuthDevScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<Set<number>>(new Set());
  const [railMode, setRailMode] = React.useState<'stepper' | 'features'>('stepper');

  const handleNext = () => {
    if (currentStep < MOCK_STEPS.length - 1) {
      const nextCompleted = new Set(completed);
      nextCompleted.add(currentStep);
      setCompleted(nextCompleted);
      setCurrentStep(currentStep + 1);
    } else {
      const nextCompleted = new Set(completed);
      nextCompleted.add(currentStep);
      setCompleted(nextCompleted);
      setCurrentStep(MOCK_STEPS.length);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompleted(new Set());
  };

  return (
    <AuthShell
      rail={railMode}
      steps={MOCK_STEPS}
      currentStep={currentStep}
      completed={completed}
      onStepClick={(idx) => setCurrentStep(idx)}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-sora text-foreground">
            {currentStep < MOCK_STEPS.length ? MOCK_STEPS[currentStep].title : 'Imekamilika'}
          </h2>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setRailMode(railMode === 'stepper' ? 'features' : 'stepper')}
          >
            Rail: {railMode}
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-[8px] border border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Step {Math.min(currentStep + 1, MOCK_STEPS.length)} of {MOCK_STEPS.length}
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <Button
            variant="neutral"
            className="flex-1"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Rudi
          </Button>
          {currentStep < MOCK_STEPS.length ? (
            <Button className="flex-1" onClick={handleNext}>
              Endelea
            </Button>
          ) : (
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReset}>
              Anza Upya
            </Button>
          )}
        </div>
      </div>
    </AuthShell>
  );
};
