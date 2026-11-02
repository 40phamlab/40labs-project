import * as React from 'react';
import { Panel, Button, Field, FieldLabel, PasswordInput } from '@40labs/ui-components';
import { Key, Copy, AlertTriangle } from 'lucide-react';
import { authApi } from '../../../../api/authApi';

interface AccountRecoverySectionProps {
  setToast: (msg: string) => void;
}

export const AccountRecoverySection: React.FC<AccountRecoverySectionProps> = ({ setToast }) => {
  const [regenPassword, setRegenPassword] = React.useState('');
  const [newCodes, setNewCodes] = React.useState<Array<string> | null>(null);
  const [regenError, setRegenError] = React.useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenError(null);
    setNewCodes(null);
    if (!regenPassword) {
      setRegenError('Password is required to regenerate recovery codes.');
      return;
    }

    setIsRegenerating(true);
    try {
      const codes = await authApi.recoveryRegenerate(regenPassword);
      setNewCodes(codes);
      setRegenPassword('');
      setToast('New recovery codes generated successfully.');
    } catch (err: any) {
      setRegenError(err?.code || 'Failed to regenerate recovery codes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text-primary tracking-tight">Account Recovery</h2>
        <p className="text-xs text-text-muted">Generate and securely store emergency recovery codes for your account.</p>
      </div>

      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Emergency Recovery Codes</h3>
              <p className="text-xs text-text-muted">Use these one-time backup codes if you lose access to your authenticator app or PIN.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegenerateCodes} className="space-y-3 pt-2 max-w-md">
          {regenError && (
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-card text-xs border border-rose-500/20">
              {regenError}
            </div>
          )}

          <Field>
            <FieldLabel required>Account Password (Required to Regenerate)</FieldLabel>
            <PasswordInput
              value={regenPassword}
              onChange={(e) => setRegenPassword(e.target.value)}
              placeholder="Enter password..."
            />
          </Field>

          <Button type="submit" intent="primary" size="sm" disabled={isRegenerating}>
            {isRegenerating ? 'Generating...' : 'Regenerate Recovery Codes'}
          </Button>
        </form>

        {newCodes && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-card space-y-3 mt-4">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} /> Save these codes securely. They will only be shown once!
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-panel p-3 rounded border border-border">
              {newCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 text-center font-bold text-text-primary">{code}</div>
              ))}
            </div>
            <Button
              type="button"
              variant="neutral"
              size="sm"
              leftIcon={<Copy size={14} />}
              onClick={() => {
                navigator.clipboard.writeText(newCodes.join('\n'));
                setToast('Recovery codes copied to clipboard.');
              }}
            >
              Copy All Codes
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
};
