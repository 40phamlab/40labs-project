import * as React from 'react';
import { authApi } from '../../../api/authApi';
import { Button } from '@40labs/ui-components';
import { Check, Copy, Download, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export interface AccessStepProps {
  businessId: string;
  credentials?: { username: string; password?: string };
  recoveryCodes?: string[];
  onCompleteSignIn: () => void;
}

export const AccessStep: React.FC<AccessStepProps> = ({
  businessId,
  credentials = { username: 'admin', password: 'TempPassword123!' },
  recoveryCodes = ['ABCDE-12345', 'FGHIJ-67890', 'KLMNO-11223', 'PQRST-44556'],
  onCompleteSignIn,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [copiedPass, setCopiedPass] = React.useState(false);
  const [copiedCodes, setCopiedCodes] = React.useState(false);
  const [savedConfirmed, setSavedConfirmed] = React.useState(false);
  const [signingIn, setSigningIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCopyPassword = () => {
    if (credentials.password) {
      navigator.clipboard.writeText(credentials.password);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadPackage = () => {
    const summary = `40Labs Registration Package\nBusiness ID: ${businessId}\nUsername: ${credentials.username}\n\nRecovery Codes:\n${recoveryCodes.join('\n')}\n\n(Password is never included in exported files for security)`;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `40Labs-Registration-${businessId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await authApi.login(credentials.username, credentials.password || 'TempPassword123!');
      onCompleteSignIn();
    } catch (err: any) {
      setError('Kuingia otomatiki kimeshindwa. Tafadhali ingia kwa kutumia jina la mtumiaji.');
      setSigningIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-xs font-medium text-[#EF4444]">{error}</p>}

      {/* Business ID Badge */}
      <div className="p-4 bg-surface border border-border rounded-[14px] flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Business ID</span>
          <span className="text-lg font-mono font-bold text-foreground">{businessId || 'AFYA-TEST01'}</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600">
          <ShieldCheck size={22} />
        </div>
      </div>

      {/* Credentials */}
      <div className="p-4 bg-surface border border-border rounded-[14px] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akaunti ya Msimamizi (SUDO)</span>
          <span className="text-xs text-orange-500 font-semibold">Imeonyeshwa mara moja tu</span>
        </div>
        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/60">
          <div>
            <span className="text-xs text-muted-foreground block">Jina la Mtumiaji</span>
            <span className="text-sm font-mono font-bold text-foreground">{credentials.username}</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/60">
          <div>
            <span className="text-xs text-muted-foreground block">Nenosiri la Muda</span>
            <span className="text-sm font-mono font-bold text-foreground">
              {showPassword ? credentials.password : '••••••••••••'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={handleCopyPassword}
              aria-label="Copy password"
              className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {copiedPass ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Codes */}
      <div className="p-4 bg-surface border border-border rounded-[14px] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Namba za Urejeshaji (Recovery Codes)</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyCodes}
              className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-border rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Copy size={12} />
              <span>{copiedCodes ? 'Imenakiliwa' : 'Nakili'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPackage}
              className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-border rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Download size={12} />
              <span>Pakua</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-background p-3 rounded-lg border border-border/60 font-mono text-sm">
          {recoveryCodes.map((code, idx) => (
            <div key={idx} className="p-1.5 bg-surface/50 rounded border border-border/40 text-center text-foreground">
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-center space-x-3 pt-2">
        <input
          type="checkbox"
          id="saved-checkbox"
          checked={savedConfirmed}
          onChange={(e) => setSavedConfirmed(e.target.checked)}
          className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
        <label htmlFor="saved-checkbox" className="text-sm font-semibold text-foreground cursor-pointer select-none">
          Nimehifadhi namba zangu za urejeshaji na nenosiri sehemu salama
        </label>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          disabled={!savedConfirmed || signingIn}
          onClick={handleSignIn}
          className="w-full h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer font-sora"
        >
          {signingIn ? 'Inaingia...' : 'Endelea kwenye Mfumo'}
        </Button>
      </div>
    </div>
  );
};
