import * as React from 'react';
import { LandingBackdrop } from './components/LandingBackdrop';
import { LandingHeader } from './components/LandingHeader';
import { FeatureCarousel } from './components/FeatureCarousel';
import { ActionPanel } from './components/ActionPanel';

interface LandingScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="relative h-full w-full overflow-y-auto flex flex-col select-none bg-transparent">
      {/* 1. Backdrop as first child, fixed z-0 */}
      <LandingBackdrop />

      {/* Header row (shrink-0) */}
      <LandingHeader />

      {/* Main Area: Flex/Grid with reserved right panel zone */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col xl:flex-row items-center justify-between px-6 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="w-full xl:w-[calc(100%-440px)] flex items-center justify-start my-auto">
          <FeatureCarousel />
        </div>
        <div className="w-full xl:w-[420px] shrink-0">
          <ActionPanel
            onGetStarted={onGetStarted}
            onSignIn={onLogin}
          />
        </div>
      </main>
    </div>
  );
};
