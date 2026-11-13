import * as React from 'react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

export interface RegistrationCredentials {
  username: string;
  password: string;
}

interface AccountStepProps {
  value: RegistrationCredentials;
  onChange: (value: RegistrationCredentials) => void;
  onValidChange: (valid: boolean) => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({ value, onChange, onValidChange }) => {
  const { language } = useLanguageStore();
  const [confirmation, setConfirmation] = React.useState('');
  const usernameValid = /^[a-z0-9._-]{3,32}$/.test(value.username.trim().toLowerCase());
  const passwordBytes = new TextEncoder().encode(value.password).length;
  const passwordValid = passwordBytes >= 12
    && passwordBytes <= 128
    && value.password.toLowerCase() !== value.username.trim().toLowerCase();
  const passwordsMatch = value.password === confirmation;

  React.useEffect(() => {
    onValidChange(usernameValid && passwordValid && passwordsMatch);
  }, [onValidChange, usernameValid, passwordValid, passwordsMatch]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t('auth.account.description', language)}
      </p>
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>{t('auth.account.username', language)}</span>
        <input
          autoComplete="username"
          value={value.username}
          onChange={(event) => onChange({ ...value, username: event.target.value.toLowerCase() })}
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="block text-xs font-normal text-muted-foreground">{t('auth.account.usernameHint', language)}</span>
      </label>
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>{t('auth.account.password', language)}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={value.password}
          onChange={(event) => onChange({ ...value, password: event.target.value })}
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="block text-xs font-normal text-muted-foreground">{t('auth.account.passwordHint', language)}</span>
      </label>
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>{t('auth.account.confirmPassword', language)}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full h-[44px] px-3.5 bg-surface border border-border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>
      {value.username && !usernameValid && <p role="alert" className="text-xs text-red-500">{t('auth.account.usernameError', language)}</p>}
      {value.password && !passwordValid && <p role="alert" className="text-xs text-red-500">{t('auth.account.passwordError', language)}</p>}
      {confirmation && !passwordsMatch && <p role="alert" className="text-xs text-red-500">{t('auth.account.confirmError', language)}</p>}
    </div>
  );
};
