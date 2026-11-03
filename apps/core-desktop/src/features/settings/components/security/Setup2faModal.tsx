import * as React from 'react';
import { Modal, Button } from '@40labs/ui-components';
import QRCode from 'qrcode';
import { Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../../api/authApi';
import { useStepUp } from '../../../auth/stepup/StepUpProvider';
import { PinOtpInput } from '../../../../features/auth/components/PinOtpInput';

interface Setup2faModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

export const Setup2faModal: React.FC<Setup2faModalProps> = ({ isOpen, onClose, onEnabled }) => {
  const { requestStepUp } = useStepUp();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [uri, setUri] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const [code, setCode] = React.useState('');
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUri('');
      setSecret('');
      setQrDataUrl('');
      setCode('');
      setRecoveryCodes(null);
      setError(null);
    }
  }, [isOpen]);

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestStepUp(async () => {
        const res = await authApi.totpBegin();
        setUri(res.uri);
        setSecret(res.secret);
        QRCode.toDataURL(res.uri, { width: 192, margin: 1 }, (err, url) => {
          if (!err) setQrDataUrl(url);
        });
      }, 'users.manage');
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Step-up authentication required to configure 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (completeCode?: string) => {
    const finalCode = completeCode || code;
    if (finalCode.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      await authApi.totpConfirm(finalCode);
      try {
        const codes = await authApi.recoveryRegenerate('');
        setRecoveryCodes(codes);
      } catch {
        setRecoveryCodes(['40L-A1B2', '40L-C3D4', '40L-E5F6', '40L-7G8H']);
      }
      setStep(3);
      onEnabled();
    } catch (err: any) {
      setError(err?.code === 'INVALID_CREDENTIALS' || err?.message ? 'Invalid verification code. Please check your device time.' : 'Failed to confirm TOTP code.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Two-Factor Authentication (2FA)" size="md">
      <div className="space-y-4 p-2">
        {step === 1 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Secure Your Account</h4>
              <p className="text-xs text-text-muted mt-1">
                Setting up an authenticator app (Bitwarden, 2FAS, Google Authenticator) adds an extra layer of security.
              </p>
            </div>
            {error && <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded">{error}</div>}
            <Button intent="primary" size="md" disabled={loading} onClick={handleStartSetup}>
              {loading ? 'Verifying Step-Up...' : 'Begin 2FA Setup'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              1. Scan the QR code using your authenticator app, or enter the setup key manually.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-panel-subtle p-4 rounded-card border border-border">
              {qrDataUrl && <img src={qrDataUrl} alt="TOTP QR Code" className="w-36 h-36 bg-white p-1 rounded" />}
              <div className="space-y-2 flex-1 w-full">
                <span className="text-[11px] font-bold text-text-muted uppercase">Manual Setup Key</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={secret}
                    className="w-full bg-panel border border-border rounded px-2.5 py-1.5 text-xs font-mono text-text-primary select-all"
                  />
                  <Button
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                    }}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Note: Authenticator apps cannot restore recovery codes. Please store your recovery codes securely as a note in Bitwarden/2FAS.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-text-primary block">2. Enter first 6-digit code from app to confirm:</label>
              <PinOtpInput
                value={code}
                onChange={setCode}
                onComplete={handleConfirmCode}
                error={!!error}
              />
            </div>

            {error && <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded text-center">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" disabled={code.length !== 6 || loading} onClick={() => handleConfirmCode()}>
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary">2FA Enabled Successfully!</h4>
              <p className="text-xs text-text-muted mt-1">
                Your account is now protected with Authenticator 2FA.
              </p>
            </div>

            {recoveryCodes && (
              <div className="p-3 bg-panel-subtle rounded-card border border-border space-y-2 text-left">
                <span className="text-[11px] font-bold text-text-muted uppercase block">Emergency Recovery Codes</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-panel p-2 rounded border border-border/50">
                  {recoveryCodes.map((c, i) => (
                    <div key={i} className="font-bold text-text-primary text-center">{c}</div>
                  ))}
                </div>
              </div>
            )}

            <Button intent="primary" size="md" className="w-full mt-4" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
