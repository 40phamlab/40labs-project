import * as React from 'react';
import { useRegistrationStore } from '../store/registrationSlice';
import { PinOtpInput } from '../components/PinOtpInput';
import { registrationApi } from '../api/registrationApi';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { Button } from '@40labs/ui-components';
import { CheckCircle2, Mail, Phone } from 'lucide-react';

export const OwnerVerifyStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { ownerPhone, ownerEmail, sameAsBusinessPhone, businessPhone } = useRegistrationStore();

  const needsPhoneVerify = !sameAsBusinessPhone && ownerPhone !== businessPhone;

  const [emailCode, setEmailCode] = React.useState('');
  const [emailVerified, setEmailVerified] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const [phoneCode, setPhoneCode] = React.useState('');
  const [phoneVerified, setPhoneVerified] = React.useState(false);
  const [phoneSent, setPhoneSent] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const allVerified = emailVerified && (!needsPhoneVerify || phoneVerified);

  React.useEffect(() => {
    onValidChange(allVerified);
  }, [allVerified, onValidChange]);

  const handleSendEmailOtp = async () => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.requestOtp(ownerEmail, 'email');
      setEmailSent(true);
    } catch (err: any) {
      setError(err?.message || 'Imeshindikana kutuma msimbo wa barua pepe');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (code: string) => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.verifyOtp(ownerEmail, code, 'email');
      setEmailVerified(true);
    } catch (err: any) {
      setError(err?.message || 'Msimbo wa barua pepe si sahihi');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.requestOtp(ownerPhone, 'sms');
      setPhoneSent(true);
    } catch (err: any) {
      setError(err?.message || 'Imeshindikana kutuma msimbo wa simu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (code: string) => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrationApi.verifyOtp(ownerPhone, code, 'sms');
      setPhoneVerified(true);
    } catch (err: any) {
      setError(err?.message || 'Msimbo wa simu si sahihi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-xs font-medium text-[#EF4444]">{error}</p>}

      {/* Email Verification Box */}
      <div className="p-4 bg-surface border border-border rounded-[12px] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-foreground">
            <Mail size={18} className="text-primary" />
            <span>Thibitisha Barua Pepe: {ownerEmail}</span>
          </div>
          {emailVerified && <CheckCircle2 size={18} className="text-emerald-600" />}
        </div>

        {!emailVerified && (
          <div className="space-y-3 pt-2">
            {!emailSent ? (
              <Button type="button" onClick={handleSendEmailOtp} disabled={loading} size="sm">
                Tuma Msimbo kwenye Barua Pepe
              </Button>
            ) : (
              <PinOtpInput
                length={6}
                value={emailCode}
                onChange={(v) => setEmailCode(v)}
                onComplete={(v) => handleVerifyEmail(v)}
              />
            )}
          </div>
        )}
      </div>

      {/* Phone Verification Box (if different) */}
      {needsPhoneVerify && (
        <div className="p-4 bg-surface border border-border rounded-[12px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-semibold text-foreground">
              <Phone size={18} className="text-primary" />
              <span>Thibitisha Namba ya Simu: {ownerPhone}</span>
            </div>
            {phoneVerified && <CheckCircle2 size={18} className="text-emerald-600" />}
          </div>

          {!phoneVerified && (
            <div className="space-y-3 pt-2">
              {!phoneSent ? (
                <Button type="button" onClick={handleSendPhoneOtp} disabled={loading} size="sm">
                  Tuma Msimbo kwenye Simu
                </Button>
              ) : (
                <PinOtpInput
                  length={6}
                  value={phoneCode}
                  onChange={(v) => setPhoneCode(v)}
                  onComplete={(v) => handleVerifyPhone(v)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
