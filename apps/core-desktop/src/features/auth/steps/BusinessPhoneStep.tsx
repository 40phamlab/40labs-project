import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

function isValidTanzanianMobile(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('255') && digits.length === 12
    ? digits.slice(3)
    : digits.startsWith('0') && digits.length === 10
      ? digits.slice(1)
      : digits.length === 9
        ? digits
        : '';
  return /^[67]\d{8}$/.test(national);
}

export const BusinessPhoneStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { businessPhone, setField } = useRegistrationStore();
  const valid = isValidTanzanianMobile(businessPhone);

  React.useEffect(() => {
    onValidChange(valid);
  }, [onValidChange, valid]);

  return (
    <Field label={t('auth.field.businessPhone', language)} error={businessPhone && !valid ? 'Weka namba sahihi ya simu ya Tanzania' : undefined} required>
      <input
        type="tel"
        autoComplete="tel"
        value={businessPhone}
        onChange={(event) => setField('businessPhone', event.target.value)}
        placeholder="0712 345 678"
        className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </Field>
  );
};
