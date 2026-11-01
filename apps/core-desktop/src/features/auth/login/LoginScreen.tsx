import * as React from 'react';
import { Button, Input, PasswordInput, Card } from '@40labs/ui-components';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { resolveLogoUrl } from '../../../api/businessApi';
import { parseAuthError } from '../../../api/authErrors';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ThemeLogo } from '../../../components/brand';
import { PinField } from '../pin/PinField';
import { useLanguageStore } from '../../../stores/useLanguageStore';

interface LoginScreenProps {
  businessName?: string;
  businessLogo?: string | null;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ businessName, businessLogo, onLoginSuccess }) => {
  const { language } = useLanguageStore();
  const isSwahili = language === 'sw-TZ' || !language || language.startsWith('sw');

  const [mode, setMode] = React.useState<'pin' | 'password'>('pin');
  const [username, setUsername] = React.useState(() => {
    try {
      return localStorage.getItem('40labs_last_username') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [retryAfterSecs, setRetryAfterSecs] = React.useState<number | null>(null);
  const [isHardLocked, setIsHardLocked] = React.useState(false);
  const [forgotModalOpen, setForgotModalOpen] = React.useState(false);

  const [resolvedLogo, setResolvedLogo] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    try {
      if (username) {
        localStorage.setItem('40labs_last_username', username.trim());
      }
    } catch {}
  }, [username]);

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

  const executeLogin = async (loginMode: 'pin' | 'password', currentPin: string, currentPass: string) => {
    if (!username || (retryAfterSecs !== null && retryAfterSecs > 0) || isHardLocked) return;
    if (loginMode === 'pin' && currentPin.length !== 6) return;
    if (loginMode === 'password' && !currentPass) return;

    setLoading(true);
    setErrorCode(null);
    setRetryAfterSecs(null);
    try {
      if (loginMode === 'pin') {
        await authApi.loginPin(username.trim().toLowerCase(), currentPin);
      } else {
        await authApi.login(username.trim().toLowerCase(), currentPass);
      }
      onLoginSuccess();
    } catch (err: any) {
      const parsed = parseAuthError(err);
      if (parsed.code === 'PASSWORD_REQUIRED') {
        setMode('password');
        setErrorCode('PASSWORD_REQUIRED');
      } else {
        setErrorCode(parsed.code);
      }
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin('password', '', password);
  };

  const handlePinComplete = async (completedPin: string) => {
    await executeLogin('pin', completedPin, '');
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
            </div>
          </div>

          {/* Segmented Control: PIN | Password */}
          <div className="flex rounded-lg bg-surface-secondary p-1 border border-border">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'pin' ? 'bg-surface-elevated text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => {
                setMode('pin');
                setErrorCode(null);
              }}
            >
              PIN
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'password' ? 'bg-surface-elevated text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => {
                setMode('password');
                setErrorCode(null);
              }}
            >
              {isSwahili ? 'Nenosiri' : 'Password'}
            </button>
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
                : errorCode === 'PASSWORD_REQUIRED'
                ? (isSwahili ? 'Nenosiri linahitajika kwa sababu mabadiliko ya usalama yametokea.' : 'Password required due to security update.')
                : (isSwahili ? 'Jina la mtumiaji au PIN si sahihi.' : 'Invalid username or PIN/password.')}
            </div>
          )}

          {mode === 'pin' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  {isSwahili ? 'Jina la mtumiaji' : 'Username'}
                </label>
                <Input
                  autoComplete="username"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                  placeholder={isSwahili ? 'Weka jina la mtumiaji' : 'Username'}
                  disabled={isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">PIN</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    onClick={() => setMode('password')}
                  >
                    {isSwahili ? 'Umesahau PIN?' : 'Forgot PIN?'}
                  </button>
                </div>
                <PinField
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  error={Boolean(errorCode)}
                />
              </div>
              {loading && (
                <div className="text-center text-xs text-text-muted animate-pulse pt-2">
                  {isSwahili ? 'Inaingia...' : 'Logging in...'}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  {isSwahili ? 'Jina la mtumiaji' : 'Username'}
                </label>
                <Input
                  autoComplete="username"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                  placeholder={isSwahili ? 'Weka jina la mtumiaji' : 'Username'}
                  disabled={isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-primary">
                    {isSwahili ? 'Nenosiri' : 'Password'}
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    onClick={() => setForgotModalOpen(true)}
                  >
                    {isSwahili ? 'Umesahau nenosiri?' : 'Forgot password?'}
                  </button>
                </div>
                <PasswordInput
                  autoComplete="current-password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  placeholder={isSwahili ? 'Weka nenosiri' : 'Password'}
                  disabled={isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
                />
              </div>
              <Button
                type="submit"
                className="w-full py-2.5 cursor-pointer"
                disabled={loading || !username || !password || isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
              >
                {loading ? (isSwahili ? 'Inaingia...' : 'Logging in...') : retryAfterSecs ? `Subiri (${retryAfterSecs}s)` : (isSwahili ? 'Ingia' : 'Login')}
              </Button>
            </form>
          )}
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
