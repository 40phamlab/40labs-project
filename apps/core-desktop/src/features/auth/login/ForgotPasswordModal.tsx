import * as React from 'react';
import { Modal, Button, Input, PasswordInput } from '@40labs/ui-components';
import { authApi } from '../../../api/authApi';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = React.useState<'withCode' | 'noCode'>('withCode');
  const [username, setUsername] = React.useState('');
  const [recoveryCode, setRecoveryCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setTab('withCode');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Nenosiri mpya hazifanani');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.recoveryRedeem(username.trim().toLowerCase(), recoveryCode.trim(), newPassword);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.code || 'INVALID_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kurejesha Nenosiri" size="sm">
      <div className="space-y-6">
        <div className="flex border-b border-border">
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'withCode' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setTab('withCode')}
          >
            Nina msimbo wa kurejesha
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'noCode' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setTab('noCode')}
          >
            Sina msimbo
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {tab === 'withCode' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la mtumiaji</label>
              <Input
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Msimbo wa kurejesha (Recovery Code)</label>
              <Input
                value={recoveryCode}
                onChange={(e: any) => setRecoveryCode(e.target.value)}
                placeholder="XXXXX-XXXXX"
                className="font-mono uppercase"
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
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" intent="neutral" onClick={onClose}>
                Ghairi
              </Button>
              <Button type="submit" disabled={loading || !username || !recoveryCode || !newPassword || !confirmPassword}>
                {loading ? 'Inatuma...' : 'Rejesha Akaunti'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tafadhali wasiliana na msimamizi wa biashara (SUDO) ili kupata nsimbo mpya wa kurejesha au kuweka upya siri yako.
            </p>
            <div className="flex justify-end pt-4">
              <Button onClick={onClose}>Funga</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
