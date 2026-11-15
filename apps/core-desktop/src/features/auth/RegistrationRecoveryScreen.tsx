import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';

interface RegistrationRecoveryScreenProps {
  onComplete: () => void;
}

export const RegistrationRecoveryScreen: React.FC<RegistrationRecoveryScreenProps> = ({ onComplete }) => {
  const [businessId, setBusinessId] = React.useState('');
  const [codes, setCodes] = React.useState<string[]>([]);
  const [confirmed, setConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const swahili = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('sw');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await authApi.registrationResumeResult();
      if (!pending?.recoveryCodes?.length) {
        setError(swahili
          ? 'Taarifa za kurejesha usajili hazipatikani kwenye hifadhi salama. Jaribu tena au wasiliana na msaada.'
          : 'The pending registration recovery details are unavailable in secure storage. Retry or contact support.');
      } else {
        setBusinessId(pending.businessId);
        setCodes(pending.recoveryCodes);
      }
    } catch {
      setError(swahili
        ? 'Hifadhi salama ya kifaa haipatikani. Jaribu tena.'
        : 'Secure device storage is unavailable. Retry.');
    } finally {
      setLoading(false);
    }
  }, [swahili]);

  React.useEffect(() => { void load(); }, [load]);

  const finish = async () => {
    setLoading(true);
    try {
      await authApi.registrationResultAck();
      onComplete();
    } catch {
      setError(swahili
        ? 'Imeshindikana kukamilisha hifadhi ya namba. Jaribu tena.'
        : 'Could not finalize recovery-code storage. Retry.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 p-6">
      <h1 className="text-xl font-bold">{swahili ? 'Hifadhi namba za urejeshaji' : 'Save your recovery codes'}</h1>
      <p className="text-sm text-muted-foreground">
        {swahili
          ? 'Usajili ulikamilika kabla programu haijafungwa. Hifadhi namba hizi sehemu salama, kisha ingia kwa jina la mtumiaji na nenosiri uliloweka.'
          : 'Registration completed before the app closed. Save these codes somewhere safe, then sign in with the username and password you chose.'}
      </p>
      {businessId && <p className="font-mono font-semibold">{businessId}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p role="status">{swahili ? 'Inapakia...' : 'Loading...'}</p>}
      {!loading && codes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3 font-mono text-sm">
            {codes.map((code) => <div key={code} className="rounded border border-border p-2 text-center">{code}</div>)}
          </div>
          <button type="button" onClick={() => navigator.clipboard.writeText(codes.join('\n'))} className="text-sm font-semibold underline">
            {swahili ? 'Nakili namba' : 'Copy codes'}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            {swahili ? 'Nimehifadhi namba hizi sehemu salama' : 'I saved these codes somewhere safe'}
          </label>
        </>
      )}
      <Button type="button" disabled={loading || (codes.length > 0 && !confirmed)} onClick={codes.length > 0 ? finish : () => void load()}>
        {codes.length > 0
          ? (swahili ? 'Endelea kuingia' : 'Continue to sign in')
          : (swahili ? 'Jaribu tena' : 'Retry')}
      </Button>
    </div>
  );
};
