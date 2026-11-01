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
import type { CreateBranchPayload, UpdateBranchPayload } from '../../../api/branchesApi';
import { useStepUp } from '../../auth/stepup/StepUpProvider';
import { TZ_ADMIN_AREAS } from '../../../lib/tzAdminAreas';
import { generateBranchCode } from '../../../lib/branchCode';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch | null;
  onSave: (payload: CreateBranchPayload | UpdateBranchPayload) => Promise<void> | void;
  isLoading?: boolean;
  existingBranches?: Branch[];
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  branch,
  onSave,
  isLoading = false,
  existingBranches = [],
}) => {
  const isEditing = Boolean(branch);
  const { requestStepUp } = useStepUp();

  const [formData, setFormData] = React.useState({
    name: '',
    region: 'Dar es Salaam',
    district: 'Ilala',
    location: '',
    status: 'active' as 'active' | 'inactive',
    contacts: '',
    branch_code: '',
  });

  const selectedRegionObj = TZ_ADMIN_AREAS.find((r) => r.name === formData.region) || TZ_ADMIN_AREAS[0];
  const districts = selectedRegionObj.districts;

  React.useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        region: 'Dar es Salaam',
        district: branch.district || districts[0] || '',
        location: branch.location || '',
        status: branch.status || 'active',
        contacts: branch.contacts || '',
        branch_code: branch.branch_code || '',
      });
    } else {
      setFormData({
        name: '',
        region: 'Dar es Salaam',
        district: districts[0] || 'Ilala',
        location: '',
        status: 'active',
        contacts: '',
        branch_code: '',
      });
    }
  }, [branch, isOpen]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    const regObj = TZ_ADMIN_AREAS.find((r) => r.name === newRegion) || TZ_ADMIN_AREAS[0];
    setFormData((prev) => ({
      ...prev,
      region: newRegion,
      district: regObj.districts[0] || '',
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    formData.name.trim() !== '' &&
    formData.region.trim() !== '' &&
    formData.district.trim() !== '';

  const businessId = branch?.business_id || 'AFYA-1001';
  const existingCodes = existingBranches.map((b) => b.branch_code);
  const previewCode = isEditing
    ? formData.branch_code
    : generateBranchCode(businessId, existingCodes, formData.district, formData.location);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    try {
      await requestStepUp(async (grantToken) => {
        await onSave({
          name: formData.name.trim(),
          location: formData.location.trim() || formData.district,
          district: formData.district.trim(),
          status: formData.status,
          contacts: formData.contacts.trim() || null,
          step_up_token: grantToken,
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
          <FieldLabel required>Region</FieldLabel>
          <select
            value={formData.region}
            onChange={handleRegionChange}
            className="w-full h-[44px] px-3.5 bg-panel border border-border rounded-[8px] text-[15px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {TZ_ADMIN_AREAS.map((reg) => (
              <option key={reg.name} value={reg.name}>
                {reg.name}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel required>District (Wilaya)</FieldLabel>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full h-[44px] px-3.5 bg-panel border border-border rounded-[8px] text-[15px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {districts.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel>Place / Street / Location Details</FieldLabel>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Ubungo Plaza, Ground Floor"
          />
        </Field>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-secondary">
            {isEditing ? 'Branch Code' : 'Branch Code (Auto)'}
          </label>
          <div className="font-mono text-xs bg-surface border border-border px-3 py-2.5 rounded-[8px] text-text-primary flex items-center justify-between">
            <span>{previewCode}</span>
            {!isEditing && (
              <span className="text-[10px] uppercase text-text-muted bg-panel px-1.5 py-0.5 rounded border border-border">
                Auto
              </span>
            )}
          </div>
        </div>

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
