import * as React from 'react';
import { Field } from '../shell/Field';
import { useRegistrationStore } from '../store/registrationSlice';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { Store, Upload } from 'lucide-react';

export const BusinessInfoStep: React.FC<{ onValidChange: (valid: boolean) => void }> = ({ onValidChange }) => {
  const { language } = useLanguageStore();
  const { businessName, logoDataUrl, setField } = useRegistrationStore();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isValid = businessName.trim().length > 0;
    onValidChange(isValid);
  }, [businessName, onValidChange]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        setError('Logo lazima iwe chini ya KB 512');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setField('logoDataUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Field label={t('auth.field.businessName', language)} error={error || undefined} required>
        <input
          type="text"
          value={businessName}
          onChange={(e) => {
            setField('businessName', e.target.value);
            if (e.target.value.trim()) setError(null);
          }}
          placeholder="f.x. Duka la Dawa Afya Bora"
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-foreground tracking-tight">
          {t('auth.field.logo', language)} <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Store size={24} className="text-muted-foreground" />
            )}
          </div>
          <label className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer transition-all flex items-center space-x-2">
            <Upload size={16} />
            <span>Pakia Nembo</span>
            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>
      </div>
    </div>
  );
};
