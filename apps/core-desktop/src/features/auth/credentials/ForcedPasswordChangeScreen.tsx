import * as React from 'react';
import { Button, PasswordInput, Card } from '@40labs/ui-components';
import { authApi } from '../../../api/authApi';

interface ForcedPasswordChangeScreenProps {
  onPasswordChanged: () => void;
}

export const ForcedPasswordChangeScreen: React.FC<ForcedPasswordChangeScreenProps> = ({ onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Nenosiri mpya hazifanani');
      return;
    }
    if (newPassword.length < 8) {
      setError('Nenosiri lazima liwe na angalau herufi 8');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      onPasswordChanged();
    } catch (err: any) {
      setError(err?.code || 'POLICY_VIOLATION');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-border rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold font-sora text-foreground">Badili Nenosiri la Muda</h1>
          <p className="text-xs text-muted-foreground">Unatakiwa kubadili nenosiri lako kabla ya kuendelea.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Nenosiri la sasa (la muda)</label>
            <PasswordInput
              value={oldPassword}
              onChange={(e: any) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Nenosiri jipya</label>
            <PasswordInput
              value={newPassword}
              onChange={(e: any) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Thibitisha nenosiri jipya</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !oldPassword || !newPassword || !confirmPassword}>
            {loading ? 'Inabadili...' : 'Badili Nenosiri'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
