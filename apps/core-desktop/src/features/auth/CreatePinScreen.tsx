import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { PinOtpInput } from './components/PinOtpInput';
import { authApi } from '../../api/authApi';

interface CreatePinScreenProps {
  onPinCreated: () => void;
}

export const CreatePinScreen: React.FC<CreatePinScreenProps> = ({ onPinCreated }) => {
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [step, setStep] = React.useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreateComplete = (val: string) => {
    if (val.length === 6) {
      setPin(val);
      setStep('confirm');
    }
  };

  const handleConfirmComplete = async (val: string) => {
    if (val.length === 6) {
      if (val !== pin) {
        setError('PIN hazifanani');
        setConfirmPin('');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await authApi.setPin(val);
        onPinCreated();
      } catch (err: any) {
        setError(err?.code || 'POLICY_VIOLATION');
        setStep('create');
        setPin('');
        setConfirmPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-border rounded-xl text-center">
        <h1 className="text-xl font-bold font-sora text-foreground">
          {step === 'create' ? 'Tengeneza PIN' : 'Thibitisha PIN'}
        </h1>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        {step === 'create' ? (
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground block">Weka namba za siri (PIN) 6</label>
            <PinOtpInput value={pin} onChange={setPin} onComplete={handleCreateComplete} />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground block">Weka tena PIN ili kuthibitisha</label>
            <PinOtpInput value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmComplete} error={!!error} />
          </div>
        )}

        <Button
          className="w-full"
          disabled={(step === 'create' ? pin.length !== 6 : confirmPin.length !== 6) || loading}
          onClick={() => {
            if (step === 'create' && pin.length === 6) setStep('confirm');
            else if (step === 'confirm' && confirmPin.length === 6) handleConfirmComplete(confirmPin);
          }}
        >
          {loading ? 'Inahifadhi...' : step === 'create' ? 'Endelea' : 'Thibitisha'}
        </Button>
      </Card>
    </div>
  );
};
