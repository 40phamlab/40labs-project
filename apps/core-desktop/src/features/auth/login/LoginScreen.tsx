import * as React from 'react';
import { Button, Input, PasswordInput, Card } from '@40labs/ui-components';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { resolveLogoUrl } from '../../../api/businessApi';
import { parseAuthError } from '../../../api/authErrors';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ThemeLogo } from '../../../components/brand';

interface LoginScreenProps {
  businessName?: string;
  businessLogo?: string | null;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ businessName, businessLogo, onLoginSuccess }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [retryAfterSecs, setRetryAfterSecs] = React.useState<number | null>(null);
  const [isHardLocked, setIsHardLocked] = React.useState(false);
  const [forgotModalOpen, setForgotModalOpen] = React.useState(false);

  const [resolvedLogo, setResolvedLogo] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    resolveLogoUrl(businessLogo).then((url) => {
      if (active) setResolvedLogo(url);
    });
    return () => {
      active = false;
    };
  }, [businessLogo]);

  // Countdown timer for LOCKED error
  React.useEffect(() => {
    if (retryAfterSecs !== null && retryAfterSecs > 0) {
      const timer = setInterval(() => {
        setRetryAfterSecs((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfterSecs]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || (retryAfterSecs !== null && retryAfterSecs > 0) || isHardLocked) return;

    setLoading(true);
    setErrorCode(null);
    setRetryAfterSecs(null);
    try {
      await authApi.login(username.trim().toLowerCase(), password);
      onLoginSuccess();
    } catch (err: any) {
      const parsed = parseAuthError(err);
      setErrorCode(parsed.code);
      if (parsed.retryAfterSecs) {
        setRetryAfterSecs(parsed.retryAfterSecs);
        if (parsed.retryAfterSecs > 900) {
          setIsHardLocked(true);
        }
      } else if (parsed.code === 'LOCKED') {
        setIsHardLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '40';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row select-none">
      {/* Left Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-primary p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        <div className="space-y-6">
          <ThemeLogo variant="full" height={44} />
          <div className="space-y-3 pt-6">
            <h2 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
              {businessName ? `Karibu ${businessName}` : 'Usimamizi Salama wa Biashara'}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-lg">
              Ingia kwenye mfumo wako kudhibiti mauzo, stoo, na huduma kwa wateja kwa usalama wa hali ya juu na kasi isiyo na kifani.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-8">
          <div className="flex items-center space-x-3 text-xs text-text-muted">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-primary" />
            </div>
            <span>Ulinzi thabiti wa data na uthibitishaji salama wa mtumiaji.</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-text-muted">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-primary" />
            </div>
            <span>Utendaji wa haraka na uwezo wa kufanya kazi hata bila mtandao.</span>
          </div>
        </div>

        <div className="text-[11px] text-text-muted font-mono">
          © 40Labs Core • Enterprise Health & Business Suite
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-border rounded-card bg-surface-elevated">
          <div className="flex flex-col items-center text-center space-y-3 lg:hidden">
            <ThemeLogo variant="full" height={36} />
            <h1 className="text-xl font-bold font-heading text-text-primary">
              {businessName || '40Labs Core'}
            </h1>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center overflow-hidden bg-surface-secondary shadow-xs">
              {resolvedLogo && !logoError ? (
                <img
                  src={resolvedLogo}
                  alt="Business Logo"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-base font-bold font-heading text-primary">
                  {getInitials(businessName)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-text-primary">Ingia kwenye Akaunti</h2>
              <p className="text-xs text-text-muted">Weka jina la mtumiaji na nenosiri lako</p>
            </div>
          </div>

          {isHardLocked && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs p-3 rounded-card flex items-start space-x-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Akaunti imefungwa kabisa baada ya majaribio mengi. Wasiliana na msimamizi (SUDO).</span>
            </div>
          )}

          {errorCode && !isHardLocked && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs p-2.5 rounded-card text-center">
              {errorCode === 'LOCKED' && retryAfterSecs
                ? `Akaunti imefungwa kwa muda. Jaribu tena baada ya sekunde ${retryAfterSecs}.`
                : 'Jina la mtumiaji au nenosiri si sahihi.'}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Jina la mtumiaji</label>
              <Input
                autoComplete="username"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                placeholder="Username"
                disabled={isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-primary">Nenosiri</label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  onClick={() => setForgotModalOpen(true)}
                >
                  Umesahau nenosiri?
                </button>
              </div>
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
              />
            </div>
            <Button
              type="submit"
              className="w-full py-2.5 cursor-pointer"
              disabled={loading || !username || !password || isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
            >
              {loading ? 'Inaingia...' : retryAfterSecs ? `Subiri (${retryAfterSecs}s)` : 'Ingia'}
            </Button>
          </form>
        </Card>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        onSuccess={() => {
          setForgotModalOpen(false);
          setErrorCode(null);
        }}
      />
    </div>
  );
};
