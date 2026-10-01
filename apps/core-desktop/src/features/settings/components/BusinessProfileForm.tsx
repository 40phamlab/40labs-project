import * as React from 'react';
import {
  Panel,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
} from '@40labs/ui-components';
import type { Business } from '@40labs/types';
import type { UpdateBusinessPayload } from '../../../hooks/useBusiness';

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
  });

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
      });
    }
  }, [business]);

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
      formData.logo_url !== (business.logo_url || '')
    );
  }, [formData, business]);

  const isValid = formData.name.trim() !== '' && formData.mobile.trim() !== '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || !isValid || isLoading) return;

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
    });
  };

  return (
    <Panel variant="raised" className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Business Profile</h2>
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
          <FieldLabel>Logo URL</FieldLabel>
          <Input
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
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
