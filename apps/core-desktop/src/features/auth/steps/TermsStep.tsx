import * as React from 'react';
import { useRegistrationStore } from '../store/registrationSlice';
import { TermsModal } from '../components/TermsModal';
import { registrationApi, type RegistrationPayload } from '../api/registrationApi';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { ShieldCheck, Loader2 } from 'lucide-react';

export interface TermsStepProps {
  onValidChange: (valid: boolean) => void;
  onCommitSuccess: (result: { businessId?: string; business_id?: string; credentials?: any; recoveryCodes?: string[] }) => void;
}

/**
 * TODO: [reason: legal text pending] [phase: auth-1E-B]
 */
export const TermsStep: React.FC<TermsStepProps> = ({ onValidChange, onCommitSuccess }) => {
  const { language } = useLanguageStore();
  const storeState = useRegistrationStore();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [readToEnd, setReadToEnd] = React.useState(false);
  const [accepted, setAccepted] = React.useState(storeState.termsAccepted);
  const [committing, setCommitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    try {
      const payload: RegistrationPayload = {
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
        terms_version: '1.0',
        terms_locale: language,
        terms_text_sha256: 'placeholder-sha256-hash',
      };

      const res = await registrationApi.commitRegistration(payload);
      onCommitSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Imeshindikana kukamilisha usajili');
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
      {error && <p role="alert" className="text-xs font-medium text-[#EF4444]">{error}</p>}

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
