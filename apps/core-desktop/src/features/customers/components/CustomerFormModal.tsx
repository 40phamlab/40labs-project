// [PHASE: MVP]
import * as React from 'react';
import { Modal } from '@40labs/ui-components';
import type { Customer } from '@40labs/types';
import { CustomerForm, type CustomerFormPayload } from './CustomerForm';

export type { CustomerFormPayload };

export interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CustomerFormPayload) => Promise<void> | void;
  editCustomer?: Customer | null;
  isLoading?: boolean;
  allCustomers?: Customer[];
  onOpenCustomerProfile?: (id: string) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editCustomer,
  isLoading = false,
  allCustomers = [],
  onOpenCustomerProfile,
}) => {
  const handleSave = async (payload: CustomerFormPayload) => {
    await onSave(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCustomer ? 'Edit Customer Profile' : 'Add Customer Profile'}
      size="lg"
    >
      <CustomerForm
        editCustomer={editCustomer}
        allCustomers={allCustomers}
        onSave={handleSave}
        onCancel={onClose}
        isLoading={isLoading}
        onOpenCustomerProfile={onOpenCustomerProfile}
      />
    </Modal>
  );
};
