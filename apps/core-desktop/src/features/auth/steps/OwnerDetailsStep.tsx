import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const OwnerDetailsStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const {
    ownerType,
    orgName,
    ownerFirstName,
    ownerLastName,
    ownerPhone,
    sameAsBusinessPhone,
    ownerEmail,
    businessPhone,
    setField,
  } = useRegistrationStore();

  const [emailError, setEmailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isOrgValid = ownerType === 'personal' || orgName.trim().length > 0;
    const isNamesValid = ownerFirstName.trim().length > 0 && ownerLastName.trim().length > 0;
    const isPhoneValid = ownerPhone.trim().length >= 9;
    const isEmailValid = ownerEmail.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());

    onValidChange(isOrgValid && isNamesValid && isPhoneValid && isEmailValid);
  }, [ownerType, orgName, ownerFirstName, ownerLastName, ownerPhone, ownerEmail, onValidChange]);

  const handleEmailChange = (val: string) => {
    setField('ownerEmail', val);
    if (val.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      setEmailError('Barua pepe si sahihi');
    } else {
      setEmailError(null);
    }
  };

  return (
    <div className="space-y-5">
      <Field label={t('auth.field.ownerType', language)} required>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'personal', label: 'Binafsi / Personal' },
            { id: 'organization', label: 'Shirika / Organization' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setField('ownerType', item.id)}
              className={`p-3.5 rounded-[10px] border text-center text-sm font-semibold transition-all cursor-pointer ${
                ownerType === item.id
                  ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-border bg-surface text-foreground hover:bg-surface-hover'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Field>

      {ownerType === 'organization' && (
        <Field label={t('auth.field.orgName', language)} required>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setField('orgName', e.target.value)}
            placeholder="f.x. Afya Network Ltd"
            className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('auth.field.firstName', language)} required>
          <input
            type="text"
            value={ownerFirstName}
            onChange={(e) => setField('ownerFirstName', e.target.value)}
            placeholder="Jina la kwanza"
            className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label={t('auth.field.lastName', language)} required>
          <input
            type="text"
            value={ownerLastName}
            onChange={(e) => setField('ownerLastName', e.target.value)}
            placeholder="Jina la ukoo"
            className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
      </div>

      <Field label={t('auth.field.ownerPhone', language)} required>
        <div className="space-y-2">
          <input
            type="tel"
            disabled={sameAsBusinessPhone}
            value={sameAsBusinessPhone ? businessPhone : ownerPhone}
            onChange={(e) => setField('ownerPhone', e.target.value)}
            placeholder="0712 345 678"
            className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameAsBusinessPhone}
              onChange={(e) => setField('sameAsBusinessPhone', e.target.checked)}
              className="rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t('auth.field.sameAsBusiness', language)}</span>
          </label>
        </div>
      </Field>

      <Field label={t('auth.field.ownerEmail', language)} error={emailError || undefined} required>
        <input
          type="email"
          value={ownerEmail}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="mmiliki@email.com"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>
    </div>
  );
};
