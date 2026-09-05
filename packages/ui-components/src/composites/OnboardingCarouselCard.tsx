import * as React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../primitives/Button';

export interface OnboardingCarouselCardProps {
  title: string;
  features: string[];
  activeStep: number;
  totalSteps: number;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * OnboardingCarouselCard composite component for highlighting product features during setup.
 * Features a hero region, checklist, pagination indicators, and clear CTA actions.
 */
export const OnboardingCarouselCard = ({
  title,
  features,
  activeStep,
  totalSteps,
  primaryAction,
  secondaryAction,
  className = '',
}: OnboardingCarouselCardProps) => {
  return (
    <div
      className={`
        w-full max-w-md mx-auto p-8 rounded-[2rem] bg-panel-strong border border-border/10
        elevation-raised flex flex-col gap-8 transition-all duration-300
        ${className}
      `}
    >
      {/* Hero Illustration Placeholder */}
      <div className="h-48 rounded-3xl bg-primary/5 flex items-center justify-center relative overflow-hidden border border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-[0.03]" />
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary elevation-raised">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-surface shadow-lg">
            <span className="text-xl font-bold font-heading">40</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-text tracking-tight">
          {title}
        </h2>

        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0 transition-transform group-hover:scale-110" />
              <span className="text-sm text-text-muted leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination & Actions */}
      <div className="mt-auto pt-4 space-y-8">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${i === activeStep ? 'w-6 bg-primary' : 'w-1.5 bg-border/40'}
              `}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            intent="primary"
            size="lg"
            fullWidth
            onClick={primaryAction.onClick}
            rightIcon={<ChevronRight size={18} />}
            className="h-14 rounded-2xl shadow-lg shadow-primary/20"
          >
            {primaryAction.label}
          </Button>

          {secondaryAction && (
            <Button
              intent="ghost"
              size="md"
              fullWidth
              onClick={secondaryAction.onClick}
              className="text-text-muted hover:text-text"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
