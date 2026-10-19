import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export const SizeStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { scale, roleScopes, setField } = useRegistrationStore();

  React.useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  return (
    <div className="space-y-6">
      <Field label={t('auth.field.scale', language)} required>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'small', label: 'Ndogo / Small' },
            { id: 'medium', label: 'Wastani / Medium' },
            { id: 'large', label: 'Kubwa / Large' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setField('scale', item.id)}
              className={`p-3.5 rounded-[10px] border text-center text-sm font-semibold transition-all cursor-pointer ${
                scale === item.id
                  ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-border bg-surface text-foreground hover:bg-surface-hover'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('auth.field.mode', language)} required>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'pharmacy', label: 'Duka la Dawa / Pharmacy' },
            { id: 'lab', label: 'Maabara / Lab' },
            { id: 'both', label: 'Zote / Both' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setField('roleScopes', item.id)}
              className={`p-3.5 rounded-[10px] border text-center text-sm font-semibold transition-all cursor-pointer ${
                roleScopes === item.id
                  ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-border bg-surface text-foreground hover:bg-surface-hover'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
};
