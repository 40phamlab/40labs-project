import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
} from '@40labs/ui-components';
import type { Branch } from '@40labs/types';
import type { CreateBranchPayload, UpdateBranchPayload } from '../../../hooks/useBusiness';
import { useStepUp } from '../../auth/stepup/StepUpProvider';
import { auditApi } from '../../../api';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch | null;
  onSave: (payload: CreateBranchPayload | UpdateBranchPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  branch,
  onSave,
  isLoading = false,
}) => {
  const isEditing = Boolean(branch);
  const { requestStepUp } = useStepUp();

  const [formData, setFormData] = React.useState({
    name: '',
    location: '',
    branch_code: '',
    status: 'active' as 'active' | 'inactive',
    contacts: '',
  });

  React.useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        location: branch.location || '',
        branch_code: branch.branch_code || '',
        status: branch.status || 'active',
        contacts: branch.contacts || '',
      });
    } else {
      setFormData({
        name: '',
        location: '',
        branch_code: '',
        status: 'active',
        contacts: '',
      });
    }
  }, [branch, isOpen]);

  const isValid =
    formData.name.trim() !== '' &&
    formData.location.trim() !== '' &&
    formData.branch_code.trim() !== '';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    try {
      await requestStepUp(async (grantToken) => {
        await auditApi.recordEntry({
          action: isEditing ? 'branch_updated' : 'branch_created',
          performed_by_user_id: null,
          target_entity_type: 'Branch',
          target_entity_id: branch?.id || 'new',
          metadata: { branch_name: formData.name, step_up_token: grantToken },
        });

        await onSave({
          name: formData.name.trim(),
          location: formData.location.trim(),
          branch_code: formData.branch_code.trim(),
          status: formData.status,
          contacts: formData.contacts.trim() || null,
        });
      }, 'branches.manage');
      onClose();
    } catch (err) {
      console.error('Branch step-up failed:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Branch' : 'Add New Branch'}
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
            onClick={handleSave}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Branch' : 'Create Branch'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Field>
          <FieldLabel required>Branch Name</FieldLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Mlimani City Branch"
            autoFocus
          />
        </Field>

        <Field>
          <FieldLabel required>Location / Address</FieldLabel>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Ubungo, Dar es Salaam"
          />
        </Field>

        <Field>
          <FieldLabel required>Branch Code</FieldLabel>
          <Input
            name="branch_code"
            value={formData.branch_code}
            onChange={handleChange}
            placeholder="e.g. BR-003"
          />
        </Field>

        <Field>
          <FieldLabel>Status</FieldLabel>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <Field>
          <FieldLabel>Branch Contacts</FieldLabel>
          <PhoneInput
            name="contacts"
            value={formData.contacts}
            onChange={handleChange}
            countryCode="+255"
            placeholder="0XXXXXXXXX"
          />
        </Field>
      </form>
    </Modal>
  );
};
