import * as React from 'react';
import { useRegistrationStore } from '../store/registrationSlice';
import { TermsModal } from '../components/TermsModal';
import { registrationApi, type RegistrationPayload } from '../api/registrationApi';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { getTermsTextSha256, TERMS_VERSION } from '../components/termsContent';
import type { RegistrationCredentials } from './AccountStep';
import { authApi } from '../../../api/authApi';

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return '';
};

export interface TermsStepProps {
  onValidChange: (valid: boolean) => void;
  verification: { token: string; phone: string } | null;
  credentials: RegistrationCredentials;
  onCommitSuccess: (result: { businessId: string; recoveryCodes: string[] }) => void;
  onRegistrationStored: () => void;
}

/**
 * TODO: [reason: legal text pending] [phase: auth-1E-B]
 */
export const TermsStep: React.FC<TermsStepProps> = ({ onValidChange, verification, credentials, onCommitSuccess, onRegistrationStored }) => {
  const { language } = useLanguageStore();
  const storeState = useRegistrationStore();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [readToEnd, setReadToEnd] = React.useState(false);
  const [accepted, setAccepted] = React.useState(storeState.termsAccepted);
  const [committing, setCommitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [registrationMayHaveCompleted, setRegistrationMayHaveCompleted] = React.useState(false);

  React.useEffect(() => {
    onValidChange(accepted);
  }, [accepted, onValidChange]);

  const handleOpenTerms = () => {
    setModalOpen(true);
  };

  const handleAcceptModal = () => {
    setReadToEnd(true);
    setAccepted(true);
    storeState.setField('termsAccepted', true);
    setModalOpen(false);
  };

  const handleCommit = async () => {
    if (!navigator.onLine) {
      setError(t('auth.error.offline', language));
      return;
    }
    setCommitting(true);
    setError(null);
    setRegistrationMayHaveCompleted(false);
    try {
      if (!verification?.token || normalizePhone(verification.phone) !== normalizePhone(storeState.ownerPhone)) {
        throw new Error(t('auth.error.registrationVerificationMismatch', language));
      }
      const payload: RegistrationPayload = {
        verification_token: verification.token,
        username: credentials.username.trim().toLowerCase(),
        password: credentials.password,
        terms_accepted: true,
        business_name: storeState.businessName,
        logo_data_url: storeState.logoDataUrl,
        region: storeState.region,
        district: storeState.district,
        kata: storeState.kata,
        scale: storeState.scale,
        role_scopes: storeState.roleScopes,
        declared_branch_count: Number(storeState.branches || 1),
        lipa_namba: storeState.lipaNamba || undefined,
        payment_number: storeState.paymentNumber || undefined,
        business_phone: storeState.businessPhone,
        owner_type: storeState.ownerType,
        organization_name: storeState.orgName || undefined,
        owner_first_name: storeState.ownerFirstName,
        owner_last_name: storeState.ownerLastName,
        owner_phone: storeState.ownerPhone,
        owner_email: storeState.ownerEmail,
        terms_version: TERMS_VERSION,
        terms_locale: 'sw-TZ',
        terms_text_sha256: await getTermsTextSha256(),
      };

      const res = await registrationApi.commitRegistration(payload);
      const businessId = res.business_id || res.businessId;
      if (!businessId || !res.recoveryCodes?.length) {
        throw new Error(t('auth.error.registrationIncomplete', language));
      }
      onCommitSuccess({ businessId, recoveryCodes: res.recoveryCodes });
    } catch (err: any) {
      const registrationTimeout = err instanceof Error
        && err.message.includes('Tauri IPC timeout for command: registration_commit');
      if (registrationTimeout) {
        try {
          const status = await authApi.status();
          if (status.deviceBound && status.business) {
            onRegistrationStored();
            return;
          }
        } catch {
          // The command may still hold the local database transaction.
        }
        setRegistrationMayHaveCompleted(true);
        setError(t('auth.error.registrationPending', language));
        setCommitting(false);
        return;
      }
      const errorCode = err && typeof err === 'object' && typeof err.code === 'string' ? err.code : null;
      setError(
        err instanceof Error && err.message
          ? err.message
          : t(errorCode === 'POLICY_VIOLATION' ? 'auth.error.registrationValidation' : 'auth.error.registrationFailed', language),
      );
      setCommitting(false);
    }
  };

  const handleCheckRegistrationStatus = async () => {
    setCommitting(true);
    try {
      const status = await authApi.status();
      if (status.deviceBound && status.business) {
        onRegistrationStored();
        return;
      }
      setError(t('auth.error.registrationStillPending', language));
    } catch {
      setError(t('auth.error.registrationStillPending', language));
    } finally {
      setCommitting(false);
    }
  };

  if (committing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <Loader2 size={48} className="animate-spin text-emerald-600" />
        <h2 className="text-lg font-bold font-sora text-foreground">Inasajili biashara yako...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-xs font-medium text-[#EF4444]">{error}</p>
          {registrationMayHaveCompleted && (
            <button type="button" onClick={handleCheckRegistrationStatus} className="text-xs font-semibold text-action-primary underline">
              {t('auth.error.checkRegistrationStatus', language)}
            </button>
          )}
        </div>
      )}

      <div className="p-5 bg-surface border border-border rounded-[14px] space-y-4">
        <div className="flex items-start space-x-3">
          <ShieldCheck size={24} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-foreground">
            <p>
              Makubaliano haya ni kati ya biashara yako na <span className="font-bold">40Labs</span>, yakikubaliwa na mmiliki au mwakilishi aliyeidhinishwa kwa niaba ya biashara.
            </p>
            <p>
              Tafadhali soma na kukubali{' '}
              <button
                type="button"
                onClick={handleOpenTerms}
                className="text-primary font-semibold underline hover:text-primary-hover cursor-pointer"
              >
                Masharti na Vigezo
              </button>{' '}
              vya mfumo kabla ya kuendelea.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            id="terms-checkbox"
            disabled={!readToEnd && !accepted}
            checked={accepted}
            onChange={(e) => {
              if (readToEnd) {
                setAccepted(e.target.checked);
                storeState.setField('termsAccepted', e.target.checked);
              } else {
                setModalOpen(true);
              }
            }}
            className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="terms-checkbox" className="text-sm font-semibold text-foreground cursor-pointer select-none">
            {t('auth.terms.consent', language)}
          </label>
        </div>
      </div>

      <TermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccept={handleAcceptModal}
      />

      <div className="pt-2">
        <button
          type="button"
          disabled={!accepted}
          onClick={handleCommit}
          className="w-full h-[48px] bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center font-sora"
        >
          Maliza na Sajili Biashara
        </button>
      </div>
    </div>
  );
};
