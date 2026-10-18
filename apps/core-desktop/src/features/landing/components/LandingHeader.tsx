import * as React from 'react';
import { BrandSlot } from './BrandSlot';
import { ThemeMenu } from './ThemeMenu';
import { LangMenu } from './LangMenu';

export const LandingHeader: React.FC = () => {
  return (
    <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
      <BrandSlot />
      <div className="flex items-center space-x-3 animate-item-rise delay-controls" style={{ animationFillMode: 'forwards' }}>
        <ThemeMenu />
        <LangMenu />
      </div>
    </header>
  );
};
