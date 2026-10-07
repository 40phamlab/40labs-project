import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { PinField } from './PinField';
import { authApi } from '../../../api/authApi';

interface CreatePinScreenProps {
  onPinCreated: () => void;
}

export const CreatePinScreen: React.FC<CreatePinScreenProps> = ({ onPinCreated }) => {
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [step, setStep] = React.useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkPolicy = (p: string): boolean => {
    if (p.length !== 6) return false;
    // All same digits
    if (new Set(p.split('')).size === 1) return true;
    // Sequential ascending or descending
    const asc = '0123456789';
    const desc = '9876543210';
    if (asc.includes(p) || desc.includes(p)) return true;
    return false;
  };

  const handleCreateComplete = (val: string) => {
    if (val.length === 6) {
      if (checkPolicy(val)) {
        setError('PIN hii ni rahisi sana kukisiwa (POLICY_VIOLATION). Tafadhali chagua nyingine.');
        setPin('');
        return;
      }
      setError(null);
      setPin(val);
      setStep('confirm');
    }
  };

  const handleConfirmComplete = async (val: string) => {
    if (val.length === 6) {
      if (val !== pin) {
        setError('PIN hazifanani. Jaribu tena.');
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
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-sora text-foreground">
            {step === 'create' ? 'Tengeneza PIN yako ya siri' : 'Thibitisha PIN'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {step === 'create'
              ? 'PIN itatumika kufungua kikao chako na idhini za haraka (taraka 6).'
              : 'Weka tena PIN uliyoweka hapo juu.'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {step === 'create' ? (
          <div className="space-y-4">
            <PinField value={pin} onChange={setPin} onComplete={handleCreateComplete} error={!!error} />
          </div>
        ) : (
          <div className="space-y-4">
            <PinField value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmComplete} error={!!error} />
          </div>
        )}

        <Button
          className="w-full"
          disabled={(step === 'create' ? pin.length !== 6 : confirmPin.length !== 6) || loading}
          onClick={() => {
            if (step === 'create' && pin.length === 6) {
              if (checkPolicy(pin)) {
                setError('PIN hii ni rahisi sana kukisiwa (POLICY_VIOLATION). Tafadhali chagua nyingine.');
                setPin('');
                return;
              }
              setStep('confirm');
            } else if (step === 'confirm' && confirmPin.length === 6) {
              handleConfirmComplete(confirmPin);
            }
          }}
        >
          {loading ? 'Inahifadhi...' : step === 'create' ? 'Endelea' : 'Thibitisha'}
        </Button>
      </Card>
    </div>
  );
};
