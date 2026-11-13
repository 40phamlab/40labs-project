import * as React from 'react';
import { useRegistrationStore } from '../store/registrationSlice';
import { PinOtpInput } from '../components/PinOtpInput';
import { registrationApi } from '../api/registrationApi';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { Button } from '@40labs/ui-components';
import { CheckCircle2, Phone } from 'lucide-react';

interface OwnerVerifyStepProps {
  onValidChange: (valid: boolean) => void;
  onVerified: (verification: { token: string; phone: string } | null) => void;
}

export const OwnerVerifyStep: React.FC<OwnerVerifyStepProps> = ({ onValidChange, onVerified }) => {
  const { language } = useLanguageStore();
  const { ownerPhone } = useRegistrationStore();
  const [code, setCode] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const previousPhone = React.useRef(ownerPhone);

  React.useEffect(() => {
    if (previousPhone.current !== ownerPhone) {
      previousPhone.current = ownerPhone;
      setCode('');
      setSent(false);
      setVerified(false);
      setError(null);
      onVerified(null);
    }
  }, [ownerPhone, onVerified]);

  React.useEffect(() => {
    onValidChange(verified);
  }, [verified, onValidChange]);

  const handleSendOtp = async () => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.requestOtp(ownerPhone);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Imeshindikana kutuma msimbo wa simu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (otp: string) => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await registrationApi.verifyOtp(ownerPhone, otp);
      onVerified({ token, phone: ownerPhone });
      setVerified(true);
    } catch (err: any) {
      setError(err?.message || 'Msimbo wa simu si sahihi');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-xs font-medium text-[#EF4444]">{error}</p>}
      <div className="p-4 bg-surface border border-border rounded-[12px] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-foreground">
            <Phone size={18} className="text-primary" />
            <span>Thibitisha namba ya mmiliki: {ownerPhone}</span>
          </div>
          {verified && <CheckCircle2 size={18} className="text-emerald-600" />}
        </div>
        {!verified && !sent && (
          <Button type="button" onClick={handleSendOtp} disabled={loading || !ownerPhone} size="sm">
            {loading ? 'Inatuma...' : 'Tuma msimbo kwa SMS'}
          </Button>
        )}
        {!verified && sent && (
          <div className={loading ? 'pointer-events-none opacity-60' : ''}>
            <PinOtpInput length={6} value={code} onChange={setCode} onComplete={handleVerify} />
          </div>
        )}
        {verified && <p className="text-sm text-emerald-600">Namba ya simu imethibitishwa.</p>}
      </div>
    </div>
  );
};
