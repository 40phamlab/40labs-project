import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { PinOtpInput } from '../components/PinOtpInput';
import { registrationApi } from '../api/registrationApi';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { Button } from '@40labs/ui-components';
import { CheckCircle2, Send } from 'lucide-react';

export const BusinessPhoneStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { businessPhone, setField } = useRegistrationStore();

  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [isVerified, setIsVerified] = React.useState(false);
  const [countdown, setCountdown] = React.useState(60);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onValidChange(isVerified);
  }, [isVerified, onValidChange]);

  React.useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async () => {
    if (!businessPhone || businessPhone.length < 9) {
      setError('Weka namba sahihi ya simu');
      return;
    }
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.requestOtp(businessPhone, 'sms');
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || 'Imeshindikana kutuma msimbo');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeVal: string) => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.verifyOtp(businessPhone, codeVal, 'sms');
      setIsVerified(true);
    } catch (err: any) {
      setError(err?.message || 'Msimbo si sahihi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Field label={t('auth.field.businessPhone', language)} error={error || undefined} required>
        <div className="flex space-x-3">
          <input
            type="tel"
            disabled={isVerified}
            value={businessPhone}
            onChange={(e) => {
              setField('businessPhone', e.target.value);
              setIsVerified(false);
              setOtpSent(false);
            }}
            placeholder="0712 345 678"
            className="flex-1 h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          {!isVerified && (
            <Button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !businessPhone}
              className="h-[44px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-semibold text-sm cursor-pointer shrink-0"
            >
              <Send size={16} className="mr-2" />
              {otpSent ? 'Tuma Tena' : 'Tuma Msimbo'}
            </Button>
          )}
        </div>
      </Field>

      {isVerified && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="text-sm font-semibold">Namba ya simu imethibitishwa kikamilifu!</span>
        </div>
      )}

      {otpSent && !isVerified && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Weka msimbo wa tarakimu 6 uliotumwa kwenye namba yako ya simu. {countdown > 0 && `(${countdown}s)`}
          </p>
          <PinOtpInput
            length={6}
            value={otpCode}
            onChange={(val) => setOtpCode(val)}
            onComplete={(val) => handleVerifyOtp(val)}
          />
        </div>
      )}
    </div>
  );
};
