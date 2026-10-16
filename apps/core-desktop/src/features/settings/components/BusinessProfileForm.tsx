import * as React from 'react';
import {
  Panel,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
} from '@40labs/ui-components';
import { Store, Upload, Trash2 } from 'lucide-react';
import type { Business } from '@40labs/types';
import type { UpdateBusinessPayload } from '../../../hooks/useBusiness';
import { businessApi, resolveLogoUrl } from '../../../api/businessApi';
import { useStepUp } from '../../auth/stepup/StepUpProvider';
import { auditApi } from '../../../api';

interface BusinessProfileFormProps {
  business?: Business;
  onSave: (payload: UpdateBusinessPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({
  business,
  onSave,
  isLoading = false,
}) => {
  const { requestStepUp } = useStepUp();

  const [formData, setFormData] = React.useState({
    name: business?.name || '',
    tin: business?.tin || '',
    tmda_number: business?.tmda_number || '',
    mobile: business?.contacts?.mobile || '',
    email: business?.contacts?.email || '',
    whatsapp: business?.contacts?.whatsapp || '',
    region: business?.address?.region || '',
    district: business?.address?.district || '',
    place: business?.address?.place || '',
    logo_url: business?.logo_url || '',
    lipa_namba: business?.lipa_namba || '',
    payment_number: business?.payment_number || '',
  });

  const [resolvedLogo, setResolvedLogo] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [logoUploadError, setLogoUploadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        tin: business.tin || '',
        tmda_number: business.tmda_number || '',
        mobile: business.contacts?.mobile || '',
        email: business.contacts?.email || '',
        whatsapp: business.contacts?.whatsapp || '',
        region: business.address?.region || '',
        district: business.address?.district || '',
        place: business.address?.place || '',
        logo_url: business.logo_url || '',
        lipa_namba: business.lipa_namba || '',
        payment_number: business.payment_number || '',
      });
    }
  }, [business]);

  React.useEffect(() => {
    let active = true;
    resolveLogoUrl(formData.logo_url).then((url) => {
      if (active) {
        setResolvedLogo(url);
        setLogoError(false);
      }
    });
    return () => {
      active = false;
    };
  }, [formData.logo_url]);

  const isDirty = React.useMemo(() => {
    if (!business) return false;
    return (
      formData.name !== (business.name || '') ||
      formData.tin !== (business.tin || '') ||
      formData.tmda_number !== (business.tmda_number || '') ||
      formData.mobile !== (business.contacts?.mobile || '') ||
      formData.email !== (business.contacts?.email || '') ||
      formData.whatsapp !== (business.contacts?.whatsapp || '') ||
      formData.region !== (business.address?.region || '') ||
      formData.district !== (business.address?.district || '') ||
      formData.place !== (business.address?.place || '') ||
      formData.logo_url !== (business.logo_url || '') ||
      formData.lipa_namba !== (business.lipa_namba || '') ||
      formData.payment_number !== (business.payment_number || '')
    );
  }, [formData, business]);

  const isValid = formData.name.trim() !== '' && formData.mobile.trim() !== '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploadError(null);
    if (file.size > 512 * 1024) {
      setLogoUploadError('Logo lazima iwe chini ya KB 512');
      return;
    }
    setUploadingLogo(true);
    try {
      const storedPath = await businessApi.uploadLogo(file);
      setFormData((prev) => ({ ...prev, logo_url: storedPath }));
    } catch (err: any) {
      setLogoUploadError(err?.message || 'Imeshindikana kupakia logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo_url: '' }));
    setLogoUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || !isValid || isLoading) return;

    try {
      const paymentChanged = formData.lipa_namba !== (business?.lipa_namba || '') || formData.payment_number !== (business?.payment_number || '');

      const executeSave = async (grantToken?: string) => {
        if (paymentChanged) {
          await auditApi.recordEntry({
            action: 'business_payment_changed',
            performed_by_user_id: null,
            target_entity_type: 'Business',
            target_entity_id: business?.business_id || 'business',
            metadata: { lipa_namba: formData.lipa_namba, payment_number: formData.payment_number, step_up_token: grantToken },
          });
        }

        await onSave({
          name: formData.name.trim(),
          tin: formData.tin.trim() || null,
          tmda_number: formData.tmda_number.trim() || null,
          contacts: {
            mobile: formData.mobile.trim(),
            email: formData.email.trim() || null,
            whatsapp: formData.whatsapp.trim() || null,
          },
          address: {
            region: formData.region.trim(),
            district: formData.district.trim(),
            place: formData.place.trim(),
          },
          logo_url: formData.logo_url.trim() || null,
          lipa_namba: formData.lipa_namba.trim() || null,
          payment_number: formData.payment_number.trim() || null,
        } as any);
      };

      if (paymentChanged) {
        await requestStepUp(async (grantToken) => {
          await executeSave(grantToken);
        }, 'settings.manage:payment');
      } else {
        await executeSave();
      }
    } catch (err) {
      console.error('Business profile update failed:', err);
    }
  };

  return (
    <Panel variant="raised" className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Business Profile & Payments</h2>
        </div>
        <Button
          type="button"
          intent="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!isDirty || !isValid || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field className="md:col-span-2">
          <FieldLabel required>Business Name</FieldLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Business Logo</FieldLabel>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center overflow-hidden bg-muted shadow-sm shrink-0">
              {resolvedLogo && !logoError ? (
                <img
                  src={resolvedLogo}
                  alt="Business Logo"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Store size={28} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border rounded-md text-xs font-medium text-foreground hover:bg-surface-hover transition-colors">
                  <Upload size={14} />
                  {uploadingLogo ? 'Inapakia...' : 'Pakia Logo Mpya'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoFileChange}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                    Ondoa
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Inakubali PNG, JPEG, WebP, SVG chini ya KB 512.</p>
              {logoUploadError && <p className="text-xs text-destructive">{logoUploadError}</p>}
            </div>
          </div>
        </Field>

        <Field>
          <FieldLabel>TIN</FieldLabel>
          <Input
            name="tin"
            value={formData.tin}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <FieldLabel>TMDA Registration Number</FieldLabel>
          <Input
            name="tmda_number"
            value={formData.tmda_number}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <FieldLabel required>Mobile Contact</FieldLabel>
          <PhoneInput
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            countryCode="+255"
            placeholder="0XXXXXXXXX"
          />
        </Field>

        <Field>
          <FieldLabel>Email Address</FieldLabel>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <FieldLabel>WhatsApp Contact</FieldLabel>
          <PhoneInput
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            countryCode="+255"
            placeholder="0XXXXXXXXX"
          />
        </Field>

        <Field>
          <FieldLabel>Lipa Namba (SUDO Step-up)</FieldLabel>
          <Input
            name="lipa_namba"
            value={formData.lipa_namba}
            onChange={handleChange}
            placeholder="e.g. 123456"
          />
        </Field>

        <Field>
          <FieldLabel>Payment Number (SUDO Step-up)</FieldLabel>
          <Input
            name="payment_number"
            value={formData.payment_number}
            onChange={handleChange}
            placeholder="+255..."
          />
        </Field>

        <div className="md:col-span-2 grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
          <Field>
            <FieldLabel>Region</FieldLabel>
            <Input
              name="region"
              value={formData.region}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <FieldLabel>District</FieldLabel>
            <Input
              name="district"
              value={formData.district}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <FieldLabel>Place / Street</FieldLabel>
            <Input
              name="place"
              value={formData.place}
              onChange={handleChange}
            />
          </Field>
        </div>
      </form>
    </Panel>
  );
};
