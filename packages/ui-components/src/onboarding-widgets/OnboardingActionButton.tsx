import React from 'react';
import { Play } from 'lucide-react';

export interface OnboardingActionButtonProps {
  label: string;
  themeVariant: 'brand-primary' | 'brand-accent' | 'outline-arrow';
  onClick: () => void;
  className?: string;
}

/**
 * OnboardingActionButton
 * A specialized button for onboarding flows with brand colors and arrow variants.
 */
export const OnboardingActionButton: React.FC<OnboardingActionButtonProps> = ({
  label,
  themeVariant,
  onClick,
  className = '',
}) => {
  const baseClasses =
    'relative flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200 h-12 px-8 select-none overflow-hidden';

  const variants = {
    'brand-primary': 'bg-primary text-white hover:opacity-95 active:scale-95',
    'brand-accent': 'bg-accent text-white hover:opacity-95 active:scale-95',
    'outline-arrow':
      'bg-white text-primary border-none pl-8 pr-2 justify-between shadow-surface-pop hover:scale-[1.02] active:scale-95',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[themeVariant]} ${className}`}
    >
      <span className={themeVariant === 'outline-arrow' ? 'flex-1 text-left' : ''}>
        {label}
      </span>
      {themeVariant === 'outline-arrow' && (
        <div className="ml-4 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-elevation-raised">
          <Play size={14} fill="currentColor" className="ml-0.5" />
        </div>
      )}
    </button>
  );
};
