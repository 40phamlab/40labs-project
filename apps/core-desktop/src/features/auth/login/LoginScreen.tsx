import * as React from 'react';
import { Button, Input, PasswordInput, Card } from '@40labs/ui-components';
import { Store, AlertTriangle } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { parseAuthError } from '../../../api/authErrors';
import { ForgotPasswordModal } from './ForgotPasswordModal';

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-border rounded-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center overflow-hidden bg-muted shadow-sm">
            {businessLogo ? (
              <img src={businessLogo} alt="Business Logo" className="w-full h-full object-cover" />
            ) : (
              <Store size={36} className="text-muted-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-bold font-sora text-foreground">
            Karibu {businessName || '40Labs'}
          </h1>
        </div>

        {isHardLocked && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg flex items-start space-x-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <span>Akaunti imefungwa kabisa baada ya majaribio mengi yaliyoshindwa. Tafadhali wasiliana na msimamizi (SUDO) kuweka upya siri yako au tumia msimbo wa kurejesha.</span>
          </div>
        )}

        {errorCode && !isHardLocked && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {errorCode === 'LOCKED' && retryAfterSecs
              ? `Akaunti imefungwa kwa muda. Jaribu tena baada ya sekunde ${retryAfterSecs}.`
              : 'Jina la mtumiaji au nenosiri si sahihi.'}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Jina la mtumiaji</label>
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
              <label className="text-sm font-medium text-foreground">Nenosiri</label>
              <button
                type="button"
                className="text-xs text-primary hover:underline font-medium"
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
            className="w-full"
            disabled={loading || !username || !password || isHardLocked || (retryAfterSecs !== null && retryAfterSecs > 0)}
          >
            {loading ? 'Inaingia...' : retryAfterSecs ? `Subiri (${retryAfterSecs}s)` : 'Ingia'}
          </Button>
        </form>
      </Card>

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
