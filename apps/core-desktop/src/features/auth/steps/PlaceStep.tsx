import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { TZ_ADMIN_AREAS } from '../../../lib/tzAdminAreas';

export const PlaceStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { region, district, kata, setField } = useRegistrationStore();

  const selectedRegionObj = TZ_ADMIN_AREAS.find((r) => r.name === region) || TZ_ADMIN_AREAS[0];
  const districts = selectedRegionObj.districts;

  React.useEffect(() => {
    const isValid = region.trim().length > 0 && district.trim().length > 0 && kata.trim().length > 0;
    onValidChange(isValid);
  }, [region, district, kata, onValidChange]);

  return (
    <div className="space-y-5">
      <Field label={t('auth.field.region', language)} required>
        <select
          value={region}
          onChange={(e) => setField('region', e.target.value)}
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {TZ_ADMIN_AREAS.map((reg) => (
            <option key={reg.name} value={reg.name}>
              {reg.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('auth.field.district', language)} required>
        <select
          value={district}
          disabled={!region}
          onChange={(e) => setField('district', e.target.value)}
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {districts.map((dist) => (
            <option key={dist} value={dist}>
              {dist}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('auth.field.kata', language)} required>
        <input
          type="text"
          value={kata}
          onChange={(e) => setField('kata', e.target.value)}
          placeholder="f.x. Upanga Mashariki"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>
    </div>
  );
};
