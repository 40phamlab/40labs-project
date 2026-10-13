import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
  Textarea,
} from '@40labs/ui-components';
import { normalizePhoneTZ } from '@40labs/i18n';

export interface AddCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: AddCustomerPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        notes: '',
      });
      setPhoneError(null);
      setGeneralError(null);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setPhoneError(null);
    setGeneralError(null);
  };

  const isFormValid =
    formData.fullName.trim() !== '' && formData.phone.trim() !== '' && !phoneError;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setGeneralError(null);
    setPhoneError(null);

    const normPhone = normalizePhoneTZ(formData.phone);
    if (!normPhone) {
      setPhoneError('Invalid phone format. Must be 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX');
      return;
    }

    try {
      await onAdd({
        fullName: formData.fullName.trim(),
        phone: normPhone,
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setFormData({
        fullName: '',
        phone: '',
        email: '',
        notes: '',
      });
      onClose();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || String(err);
      if (msg.includes('DUPLICATE_PHONE')) {
        setGeneralError('This phone number is already registered for another customer.');
      } else if (msg.includes('INVALID_PHONE')) {
        setPhoneError('Invalid phone number format.');
      } else if (msg.includes('INVALID_FULL_NAME')) {
        setGeneralError('Full name is required.');
      } else {
        setGeneralError(msg || 'An error occurred while saving customer profile.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Customer Profile"
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            intent="neutral"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            onClick={handleAdd}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Customer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleAdd} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-card text-xs text-danger">
            {generalError}
          </div>
        )}

        <Field>
          <FieldLabel required>Full Name</FieldLabel>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Juma Hamisi"
            autoFocus
          />
        </Field>

        <Field>
          <FieldLabel required>Phone Number</FieldLabel>
          <PhoneInput
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            countryCode="+255"
            placeholder="0XXXXXXXXX"
          />
          {phoneError && <p className="mt-1 text-xs text-danger">{phoneError}</p>}
        </Field>

        <Field>
          <FieldLabel>Email Address</FieldLabel>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="optional@example.com"
          />
        </Field>

        <Field>
          <FieldLabel>Notes</FieldLabel>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Customer preferences, medical history notes, or special requirements..."
          />
        </Field>
      </form>
    </Modal>
  );
};
