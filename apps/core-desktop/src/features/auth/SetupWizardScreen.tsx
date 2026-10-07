import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';

interface SetupWizardScreenProps {
  onSetupComplete: () => void;
}

export const SetupWizardScreen: React.FC<SetupWizardScreenProps> = ({ onSetupComplete }) => {
  const [loading, setLoading] = React.useState(false);

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      await authApi.onboardingAdvance('setup_complete');
      onSetupComplete();
    } catch {
      // fallback
      onSetupComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-lg p-8 space-y-6 shadow-lg border border-border rounded-xl text-center">
        <h1 className="text-2xl font-bold font-sora text-foreground">Usanidi wa Awali wa Biashara</h1>
        <p className="text-sm text-muted-foreground">
          Biashara yako imesajiliwa kikamilifu. Bonyeza kitufe hapa chini ili kumalizia usanidi wa awali na kuanza kutumia mfumo.
        </p>
        <Button className="w-full" disabled={loading} onClick={handleFinishSetup}>
          {loading ? 'Inakamilisha...' : 'Maliza Usanidi'}
        </Button>
      </Card>
    </div>
  );
};
