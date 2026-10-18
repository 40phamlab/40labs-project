import * as React from 'react';
import { LandingBackdrop } from '../../landing/components/LandingBackdrop';
import { ThemeMenu } from '../../landing/components/ThemeMenu';
import { LangMenu } from '../../landing/components/LangMenu';
import { HexStepper, type StepDef } from './HexStepper';
import { FeatureStrip } from './FeatureStrip';
import { authTokens } from './authTokens';

export interface AuthShellProps {
  rail: 'stepper' | 'features';
  steps?: StepDef[];
  currentStep?: number;
  completed?: Set<number>;
  onStepClick?: (stepIndex: number) => void;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  rail,
  steps = [],
  currentStep = 0,
  completed,
  onStepClick,
  children,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col lg:flex-row select-none overflow-x-hidden">
      {/* Landing Background Backdrop */}
      <LandingBackdrop />

      {/* Top Header Controls (Seamless page, no background band) */}
      <div className="absolute top-4 right-6 z-30 flex items-center space-x-3">
        <ThemeMenu />
        <LangMenu />
      </div>

      {/* Left Rail (~340px on desktop, collapses to top progress bar under ~900px / mobile) */}
      <aside className="hidden lg:flex lg:w-[340px] shrink-0 p-8 flex-col justify-between z-20 border-r border-border/40 backdrop-blur-[2px]">
        <div className="space-y-8">
          {/* Top-left Brand Logo: Orange '40' + Green 'Labs' */}
          <div className="flex items-center space-x-2 pt-2">
            <div className="flex items-center font-sora font-extrabold text-2xl tracking-tight">
              <span style={{ color: authTokens.colors.orange }}>40</span>
              <span style={{ color: authTokens.colors.green }}>Labs</span>
            </div>
          </div>

          {/* Rail Content: Stepper or Features */}
          <div className="pt-4">
            {rail === 'stepper' ? (
              <HexStepper
                steps={steps}
                currentStep={currentStep}
                completed={completed}
                onStepClick={onStepClick}
              />
            ) : (
              <FeatureStrip />
            )}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono pt-8">
          © 40Labs Core • Enterprise Suite
        </div>
      </aside>

      {/* Mobile / Responsive Top Progress / Header bar for screens < 900px */}
      <div className="lg:hidden flex flex-col p-6 z-25 border-b border-border/40 bg-surface/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center font-sora font-extrabold text-xl">
            <span style={{ color: authTokens.colors.orange }}>40</span>
            <span style={{ color: authTokens.colors.green }}>Labs</span>
          </div>
        </div>
        {rail === 'stepper' && steps.length > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                backgroundColor: authTokens.colors.green,
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Right Form Card Panel */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 z-20">
        <div
          className={`w-full max-w-[480px] p-8 shadow-lg border border-border bg-surface/90 backdrop-blur-xl ${authTokens.radius.card}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
