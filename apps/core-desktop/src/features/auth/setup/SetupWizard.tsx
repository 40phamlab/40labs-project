import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { CheckCircle2, Plus } from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import { useBusiness } from '../../../hooks/useBusiness';
import { useStepUp } from '../stepup/StepUpProvider';
import { UserFormModal } from '../../settings/components/UserFormModal';
import { authApi } from '../../../api/authApi';

interface SetupWizardProps {
  onSetupComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [step, setStep] = React.useState<number>(1);
  const [idleMinutes, setIdleMinutes] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { users, createUser, isUserModalOpen, openAddUserModal, closeUserModal } = useUsers();
  const { branches } = useBusiness();
  const { requestStepUp } = useStepUp();

  const handleSaveUser = async (payload: any) => {
    try {
      await requestStepUp(async (_grantToken) => {
        await createUser({ ...payload, step_up_token: _grantToken });
      }, 'users.manage');
    } catch (err: any) {
      setError(err?.code || 'Imeshindwa kuongeza mtumiaji');
    }
  };

  const handleSaveIdleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestStepUp(async (_grantToken) => {
        await authApi.businessSetIdleLock(idleMinutes);
      }, 'settings.manage:idle');
      setStep(3);
    } catch (err: any) {
      setError(err?.code || 'Imeshindwa kuhifadhi muda wa kufunga');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      await authApi.onboardingAdvance('setup_complete');
      onSetupComplete();
    } catch (err: any) {
      setError(err?.code || 'Imeshindwa kukamilisha usanidi');
      onSetupComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-2xl p-8 space-y-6 shadow-xl border border-border rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-sora text-foreground">Usanidi wa Awali wa Biashara</h1>
          <p className="text-xs text-muted-foreground font-mono">Hatua {step} ya 3</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Step 1: Team */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">1. Timu na Wafanyakazi</h3>
                <p className="text-xs text-muted-foreground">Ongeza wasimamizi au wafanyakazi kwenye mfumo.</p>
              </div>
              <Button intent="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openAddUserModal}>
                Ongeza mtumiaji
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between bg-muted/30">
                  <div>
                    <span className="text-sm font-semibold text-foreground block">{u.full_name}</span>
                    <span className="text-xs font-mono text-muted-foreground">@{u.username} · {u.role.toUpperCase()}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${u.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {u.active ? 'Hai' : 'Haimiliki'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button intent="neutral" onClick={() => setStep(2)}>
                Ruka
              </Button>
              <Button onClick={() => setStep(2)}>
                Endelea
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Idle Lock */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">2. Muda wa Kufunga Kikao (Idle Lock)</h3>
              <p className="text-xs text-muted-foreground">Chagua muda wa kutokuwepo shughuli kabla ya mfumo kujifunga.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Muda (Dakika 1 - 30)</label>
              <select
                value={idleMinutes}
                onChange={(e) => setIdleMinutes(Number(e.target.value))}
                className="w-full text-sm bg-panel-subtle border border-border rounded-input p-3 text-text-primary"
              >
                {[1, 2, 3, 5, 10, 15, 20, 25, 30].map((m) => (
                  <option key={m} value={m}>{m} dakika</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button intent="neutral" onClick={() => setStep(1)}>
                Rudi
              </Button>
              <Button disabled={loading} onClick={handleSaveIdleLock}>
                {loading ? 'Inahifadhi...' : 'Hifadhi na Endelea'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Finish */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-sora text-foreground">Kila kitu kiko tayari!</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Usanidi wa awali umekamilika. Sasa unaweza kuanza kutumia mfumo wa 40Labs kuendesha biashara yako.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button intent="neutral" onClick={() => setStep(2)}>
                Rudi
              </Button>
              <Button disabled={loading} onClick={handleFinishSetup}>
                {loading ? 'Inakamilisha...' : 'Maliza na Anza'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        branches={branches}
        onSave={handleSaveUser}
      />
    </div>
  );
};
