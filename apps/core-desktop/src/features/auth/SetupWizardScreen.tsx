import * as React from 'react';
import { SetupWizard } from './setup/SetupWizard';

interface SetupWizardScreenProps {
  onSetupComplete: () => void;
}

export const SetupWizardScreen: React.FC<SetupWizardScreenProps> = ({ onSetupComplete }) => {
  return <SetupWizard onSetupComplete={onSetupComplete} />;
};
