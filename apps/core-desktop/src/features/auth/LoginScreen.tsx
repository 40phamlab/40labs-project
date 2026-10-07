import * as React from 'react';
import { Button, Input, PasswordInput, Card } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';

interface LoginScreenProps {
  businessName?: string;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ businessName, onLoginSuccess }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);
    try {
      await authApi.login(username.trim().toLowerCase(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.code || 'INVALID_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-border rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-sora text-foreground">
            Karibu {businessName || '40Labs'}
          </h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
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
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Nenosiri</label>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !username || !password}>
            {loading ? 'Inaingia...' : 'Ingia'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
