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
import { type Customer } from '@40labs/types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newCustomer: Customer) => void;
}

/**
 * AddCustomerModal
 *
 * Provides a form to create a new customer record.
 * Following the design pattern of NewStockModal for consistency.
 */
export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = React.useState({
    full_name: '',
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

  // Basic validation: Name and Phone are required for a valid customer profile.
  const isFormValid =
    formData.full_name.trim() !== '' && formData.phone.trim() !== '';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Placeholder session context (matches mockData.ts constants)
    const WORKSPACE_ID = 'ws_dev_001';
    const BRANCH_ID = 'br_dev_001';
    const now = new Date().toISOString();
    const idSuffix = Math.random().toString(36).substr(2, 9);

    /**
     * OFFLINE BEHAVIOR:
     * This record should be persisted to SQLite immediately once the data layer
     * is fully wired (post-MVP). For now, it updates local React state.
     */
    const newCustomer: Customer = {
      id: `cust_new_${idSuffix}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email || null,
      outstanding_balance: 0,
      notes: formData.notes || null,
      amob_patient_id: null,
    };

    onAdd(newCustomer);

    // Reset form for next usage
    setFormData({
      full_name: '',
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
      title="Add Customer"
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            intent="accent"
            onClick={onClose}
            className="rounded-full px-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            onClick={handleAdd as any}
            disabled={!isFormValid}
            className="rounded-full px-8 shadow-surface-pop"
          >
            Save Customer
          </Button>
        </div>
      }
    >
      <form onSubmit={handleAdd} className="space-y-4">
        <Field>
          <FieldLabel required>Full Name</FieldLabel>
          <Input
            name="full_name"
            value={formData.full_name}
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
