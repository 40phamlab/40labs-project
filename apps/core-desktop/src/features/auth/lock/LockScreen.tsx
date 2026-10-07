import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { Lock } from 'lucide-react';
import { PinField } from '../pin/PinField';
import { authApi } from '../../../api/authApi';

interface LockScreenProps {
  displayName?: string;
  businessName?: string;
  onUnlockSuccess: () => void;
  onSwitchUser: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ displayName, businessName, onUnlockSuccess, onSwitchUser }) => {
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
      setError(err?.code === 'LOCKED' ? 'Majaribio yamezidi. Kikao kimefutwa.' : 'PIN si sahihi');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async () => {
    try {
      await authApi.logout();
      onSwitchUser();
    } catch {
      onSwitchUser();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border border-border rounded-xl text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sora text-foreground">Kikao kimefungwa</h1>
            <p className="text-sm font-medium text-foreground mt-1">{displayName || 'Mtumiaji'}</p>
            {businessName && <p className="text-xs text-muted-foreground">{businessName}</p>}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-medium text-foreground block">Weka PIN ya tarakimu 6</label>
          <PinField
            value={pin}
            onChange={setPin}
            onComplete={handleUnlock}
            error={!!error}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Button
            className="w-full"
            disabled={pin.length !== 6 || loading}
            onClick={() => handleUnlock()}
          >
            {loading ? 'Inafungua...' : 'Fungua'}
          </Button>

          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            onClick={handleSwitchUser}
          >
            Badili mtumiaji
          </button>
        </div>
      </Card>
    </div>
  );
};
