import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

interface RegistrationRecoveryScreenProps {
  onComplete: () => void;
}

export const RegistrationRecoveryScreen: React.FC<RegistrationRecoveryScreenProps> = ({ onComplete }) => {
  const { language } = useLanguageStore();
  const [businessId, setBusinessId] = React.useState('');
  const [codes, setCodes] = React.useState<string[]>([]);
  const [confirmed, setConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await authApi.registrationResumeResult();
      if (!pending?.recoveryCodes?.length) {
        setError(t('auth.recovery.errorUnavailable', language));
      } else {
        setBusinessId(pending.businessId);
        setCodes(pending.recoveryCodes);
      }
    } catch {
      setError(t('auth.recovery.errorStorage', language));
    } finally {
      setLoading(false);
    }
  }, [language]);

  React.useEffect(() => { void load(); }, [load]);

  const finish = async () => {
    setLoading(true);
    try {
      await authApi.registrationResultAck();
      onComplete();
    } catch {
      setError(t('auth.recovery.errorFinalize', language));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 p-6">
      <h1 className="text-xl font-bold">{t('auth.recovery.title', language)}</h1>
      <p className="text-sm text-muted-foreground">
        {t('auth.recovery.description', language)}
      </p>
      {businessId && <p className="font-mono font-semibold">{businessId}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p role="status">{t('auth.recovery.loading', language)}</p>}
      {!loading && codes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3 font-mono text-sm">
            {codes.map((code) => <div key={code} className="rounded border border-border p-2 text-center">{code}</div>)}
          </div>
          <button type="button" onClick={() => navigator.clipboard.writeText(codes.join('\n'))} className="text-sm font-semibold underline">
            {t('auth.recovery.copyCodes', language)}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            {t('auth.recovery.savedConsent', language)}
          </label>
        </>
      )}
      <Button type="button" disabled={loading || (codes.length > 0 && !confirmed)} onClick={codes.length > 0 ? finish : () => void load()}>
        {codes.length > 0
          ? t('auth.recovery.continue', language)
          : t('auth.recovery.retry', language)}
      </Button>
    </div>
  );
};
