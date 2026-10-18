import * as React from 'react';
import { authTokens } from './authTokens';

export interface StepDef {
  id: string | number;
  title: string;
}

export interface HexStepperProps {
  steps: StepDef[];
  currentStep: number; // 0-based index
  completed?: Set<number>;
  onStepClick?: (stepIndex: number) => void;
}

export const HexStepper: React.FC<HexStepperProps> = ({
  steps,
  currentStep,
  completed = new Set(),
  onStepClick,
}) => {
  const allDone = currentStep >= steps.length || (completed.size === steps.length);

  return (
    <div className="space-y-2 py-4 select-none" role="navigation" aria-label="Registration Progress">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completed.has(index) || index < currentStep;

        const canClick = isCompleted && onStepClick;

        return (
          <div key={step.id} className="relative flex items-start group">
            {/* Vertical Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-[16px] top-[32px] w-[2px] h-[32px] bg-border overflow-hidden">
                <div
                  className="w-full h-full transition-all duration-400 ease-out motion-reduce:transition-none"
                  style={{
                    backgroundColor: isCompleted ? authTokens.colors.green : 'transparent',
                    transform: isCompleted ? 'translateY(0)' : 'translateY(-100%)',
                  }}
                />
              </div>
            )}

            {/* Hex Node Button / Display */}
            <div className="relative flex items-center space-x-3.5 w-full">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(index)}
                className={`relative w-[32px] h-[32px] shrink-0 flex items-center justify-center focus:outline-none ${
                  canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                } transition-transform motion-reduce:transform-none`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ', completed' : ''}`}
              >
                {/* Active Pulsing Ring */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-[6px] border-2 border-orange-500 animate-pulse motion-reduce:animate-none opacity-80"
                    style={{ borderColor: authTokens.colors.orange }}
                  />
                )}

                {/* Hexagon SVG */}
                <svg className="w-full h-full" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <polygon
                    points="16,2 28,9 28,23 16,30 4,23 4,9"
                    fill={
                      allDone || isCompleted
                        ? authTokens.colors.green
                        : isActive
                        ? 'transparent'
                        : 'var(--surface)'
                    }
                    stroke={
                      allDone || isCompleted
                        ? authTokens.colors.green
                        : isActive
                        ? authTokens.colors.orange
                        : 'var(--border)'
                    }
                    strokeWidth={isActive || isCompleted ? '2' : '1.5'}
                    vectorEffect="non-scaling-stroke"
                    className={`transition-colors duration-300 ${
                      isCompleted ? 'animate-in zoom-in-95 duration-200' : ''
                    }`}
                  />
                </svg>

                {/* Content inside Hex */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {allDone || isCompleted ? (
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline
                        points="20 6 9 17 4 12"
                        style={{
                          strokeDasharray: 24,
                          strokeDashoffset: 0,
                        }}
                        className="animate-in fade-in duration-300 motion-reduce:animate-none"
                      />
                    </svg>
                  ) : (
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
              </button>

              {/* Step Title (Titles only, no helper text) */}
              <div className="flex flex-col justify-center py-1">
                <span
                  className={`text-sm tracking-tight transition-all duration-200 ${authTokens.typography.heading} ${
                    isActive
                      ? 'font-bold text-foreground scale-[1.02]'
                      : isCompleted
                      ? 'font-medium text-foreground/80'
                      : 'font-normal text-muted-foreground/60'
                  }`}
                >
                  {step.title}
                </span>
                {isCompleted && (
                  <span className="sr-only">Completed step</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
