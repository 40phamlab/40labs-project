import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
} from '@40labs/ui-components';
import type { User, Branch, StaffPermissionSet, UserRole } from '@40labs/types';
import type { CreateUserPayload, UpdateUserPayload } from '../../../hooks/useUsers';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  branches: Branch[];
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void> | void;
  isLoading?: boolean;
}

const DEFAULT_PERMISSIONS: StaffPermissionSet = {
  can_update_stock: true,
  can_adjust_stock: false,
  can_issue_refund: false,
  can_approve_po: false,
  can_add_lab_sample: false,
  can_override_lab_result: false,
  can_view_reports: true,
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  user,
  branches,
  onSave,
  isLoading = false,
}) => {
  const isEditing = Boolean(user);

  const [formData, setFormData] = React.useState({
    full_name: '',
    contacts: '',
    location: '',
    role: 'staff' as UserRole,
    branch_id: branches[0]?.id || '',
    pin: '',
    permissions: { ...DEFAULT_PERMISSIONS } as StaffPermissionSet,
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        contacts: user.contacts || '',
        location: user.location || '',
        role: user.role || 'staff',
        branch_id: user.branch_id || branches[0]?.id || '',
        pin: '',
        permissions: user.permissions ? { ...user.permissions } : { ...DEFAULT_PERMISSIONS },
      });
    } else {
      setFormData({
        full_name: '',
        contacts: '',
        location: branches[0]?.location || '',
        role: 'staff',
        branch_id: branches[0]?.id || '',
        pin: '1234',
        permissions: { ...DEFAULT_PERMISSIONS },
      });
    }
  }, [user, isOpen, branches]);

  const isValid = formData.full_name.trim() !== '' && formData.branch_id.trim() !== '';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (key: keyof StaffPermissionSet) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    const payload = {
      full_name: formData.full_name.trim(),
      contacts: formData.contacts.trim() || null,
      location: formData.location.trim() || null,
      role: formData.role,
      branch_id: formData.branch_id,
      pin: formData.pin.trim() || '1234',
      permissions: formData.role === 'sudo' ? null : formData.permissions,
    };

    if (isEditing) {
      await onSave(payload as UpdateUserPayload);
    } else {
      await onSave(payload as CreateUserPayload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User & Permissions' : 'Add New Staff User'}
      size="lg"
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
            {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Full Name</FieldLabel>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Dr. John Doe"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel>Role</FieldLabel>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="staff">Staff (Custom Permissions)</option>
              <option value="sudo">Sudo (Owner / Full Access)</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Branch Assignment</FieldLabel>
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={(e) => {
                const bId = e.target.value;
                const selectedBranch = branches.find((b) => b.id === bId);
                setFormData((prev) => ({
                  ...prev,
                  branch_id: bId,
                  location: selectedBranch ? selectedBranch.location : prev.location,
                }));
              }}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.branch_code})
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel>Location / Outlet Label</FieldLabel>
            <Input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Main Branch - Dar es Salaam"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Contacts (Phone)</FieldLabel>
            <PhoneInput
              name="contacts"
              value={formData.contacts}
              onChange={handleChange}
              countryCode="+255"
              placeholder="0XXXXXXXXX"
            />
          </Field>

          <Field>
            <FieldLabel>{isEditing ? 'Reset PIN (optional)' : 'Initial PIN'}</FieldLabel>
            <Input
              name="pin"
              type="password"
              maxLength={6}
              value={formData.pin}
              onChange={handleChange}
              placeholder="4-6 digit PIN"
            />
          </Field>
        </div>

        {formData.role === 'staff' ? (
          <div className="pt-2 border-t border-border/40 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Orbit Worker & POS Permission Matrix
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2 bg-panel-subtle p-3 rounded-card border border-border/50">
              {[
                { key: 'can_update_stock', label: 'Update Stock' },
                { key: 'can_adjust_stock', label: 'Adjust Stock', pinGated: true },
                { key: 'can_issue_refund', label: 'Issue Refunds', pinGated: true },
                { key: 'can_approve_po', label: 'Approve Orders', pinGated: true },
                { key: 'can_add_lab_sample', label: 'Add Samples' },
                { key: 'can_override_lab_result', label: 'Override Results', pinGated: true },
                { key: 'can_view_reports', label: 'View Reports' },
              ].map(({ key, label, pinGated }) => {
                const permKey = key as keyof StaffPermissionSet;
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between text-xs text-text-primary cursor-pointer hover:bg-panel/50 p-1.5 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions[permKey]}
                        onChange={() => handlePermissionChange(permKey)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    {pinGated && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded font-semibold">
                        PIN-Gated
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-info/10 text-info text-xs rounded-card">
            <strong>Sudo Role:</strong> Sudo users possess full administrator privileges and implicit access to all modules and permission sets.
          </div>
        )}
      </form>
    </Modal>
  );
};
