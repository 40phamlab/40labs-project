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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    formData.fullName.trim() !== '' && formData.phone.trim() !== '';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    await onAdd({
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
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
