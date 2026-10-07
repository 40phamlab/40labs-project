import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { PinOtpInput } from './components/PinOtpInput';
import { authApi } from '../../api/authApi';

interface LockScreenProps {
  displayName?: string;
  onUnlockSuccess: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ displayName, onUnlockSuccess }) => {
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUnlock = async (completePin?: string) => {
    const finalPin = completePin || pin;
    if (finalPin.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      await authApi.unlockPin(finalPin);
      onUnlockSuccess();
    } catch (err: any) {
      setError(err?.code || 'INVALID_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border border-border rounded-xl text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-sora text-foreground">Kikao kimefungwa</h1>
          <p className="text-sm text-muted-foreground">{displayName || 'Mtumiaji'}</p>
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <div className="space-y-4">
          <label className="text-sm font-medium text-foreground block">Weka PIN ya tarakimu 6</label>
          <PinOtpInput
            value={pin}
            onChange={setPin}
            onComplete={handleUnlock}
            error={!!error}
          />
        </div>

        <Button className="w-full" disabled={pin.length !== 6 || loading} onClick={() => handleUnlock()}>
          {loading ? 'Inafungua...' : 'Fungua'}
        </Button>
      </Card>
    </div>
  );
};
