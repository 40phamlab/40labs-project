import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const PaymentsStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { branches, lipaNamba, paymentNumber, setField } = useRegistrationStore();

  React.useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  return (
    <div className="space-y-5">
      <Field label={t('auth.field.branches', language)}>
        <input
          type="number"
          min="1"
          value={branches}
          onChange={(e) => setField('branches', e.target.value)}
          placeholder="1"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      <Field label={t('auth.field.lipaNamba', language)}>
        <input
          type="text"
          value={lipaNamba}
          onChange={(e) => setField('lipaNamba', e.target.value)}
          placeholder="f.x. 123456"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      <Field label={t('auth.field.paymentNumber', language)}>
        <input
          type="text"
          value={paymentNumber}
          onChange={(e) => setField('paymentNumber', e.target.value)}
          placeholder="f.x. 0712345678"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>
    </div>
  );
};
