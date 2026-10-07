import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
} from '@40labs/ui-components';
import type { User, Branch, RolePreset } from '@40labs/types';
import { Key } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  branches: Branch[];
  onSave: (payload: any) => Promise<void> | void;
  isLoading?: boolean;
}

const PRESET_PERMISSIONS: Record<RolePreset, string[]> = {
  sudo: ['inventory.adjust', 'users.manage', 'branches.manage', 'settings.manage', 'sales.refund', 'interaction.override', 'purchases.approve', 'sales.discount', 'can_update_stock', 'can_adjust_stock', 'can_issue_refund', 'can_approve_po', 'can_add_lab_sample', 'can_override_lab_result', 'can_view_reports'],
  admin: ['inventory.adjust', 'users.manage', 'settings.manage', 'sales.refund', 'interaction.override', 'purchases.approve', 'sales.discount', 'can_update_stock', 'can_adjust_stock', 'can_issue_refund', 'can_approve_po', 'can_add_lab_sample', 'can_override_lab_result', 'can_view_reports'],
  pharmacist: ['can_update_stock', 'can_adjust_stock', 'can_issue_refund', 'can_approve_po', 'can_view_reports', 'sales.discount', 'interaction.override'],
  lab_technician: ['can_add_lab_sample', 'can_override_lab_result', 'can_view_reports'],
};

const ALL_PERMISSIONS = [
  { key: 'can_update_stock', label: 'Update Stock' },
  { key: 'can_adjust_stock', label: 'Adjust Stock (PIN Gated)' },
  { key: 'can_issue_refund', label: 'Issue Refunds (PIN Gated)' },
  { key: 'can_approve_po', label: 'Approve PO' },
  { key: 'can_add_lab_sample', label: 'Add Lab Sample' },
  { key: 'can_override_lab_result', label: 'Override Lab Result' },
  { key: 'can_view_reports', label: 'View Reports' },
  { key: 'inventory.adjust', label: 'Inventory Adjust' },
  { key: 'users.manage', label: 'Users Manage' },
  { key: 'branches.manage', label: 'Branches Manage' },
  { key: 'settings.manage', label: 'Settings Manage' },
  { key: 'sales.refund', label: 'Sales Refund' },
  { key: 'interaction.override', label: 'Interaction Override' },
  { key: 'purchases.approve', label: 'Purchases Approve' },
  { key: 'sales.discount', label: 'Sales Discount' },
];

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
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    rolePreset: 'pharmacist' as RolePreset,
    branchId: branches[0]?.id || '',
    isSuperintendent: false,
    permissions: [] as string[],
    tempPassword: '',
  });

  const [generatedPass, setGeneratedPass] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        rolePreset: user.role_preset || 'pharmacist',
        branchId: (user as any).branch_id || branches[0]?.id || '',
        isSuperintendent: user.is_superintendent || false,
        permissions: user.permissions ? Object.keys(user.permissions).filter(k => user.permissions![k]) : PRESET_PERMISSIONS[user.role_preset || 'pharmacist'],
        tempPassword: '',
      });
      setGeneratedPass(null);
    } else {
      const defaultPreset: RolePreset = 'pharmacist';
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
        rolePreset: defaultPreset,
        branchId: branches[0]?.id || '',
        isSuperintendent: false,
        permissions: PRESET_PERMISSIONS[defaultPreset],
        tempPassword: '',
      });
      setGeneratedPass(null);
    }
  }, [user, isOpen, branches]);

  const handlePresetChange = (preset: RolePreset) => {
    setFormData((prev) => ({
      ...prev,
      rolePreset: preset,
      permissions: PRESET_PERMISSIONS[preset],
    }));
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, tempPassword: pass }));
    setGeneratedPass(pass);
  };

  const isValid = formData.firstName.trim() !== '' && formData.lastName.trim() !== '' && (isEditing || formData.username.trim() !== '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    const payload = {
      username: formData.username.trim().toLowerCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || null,
      rolePreset: formData.rolePreset,
      role: formData.rolePreset === 'sudo' ? 'sudo' : 'staff',
      branchId: formData.branchId,
      isSuperintendent: formData.isSuperintendent,
      permissions: formData.permissions,
      tempPassword: formData.tempPassword.trim() || undefined,
    };

    await onSave(payload);
    if (!isEditing && !generatedPass) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Hariri Mtumiaji' : 'Ongeza Mtumiaji Mpya'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" intent="neutral" onClick={onClose} disabled={isLoading}>
            Ghairi
          </Button>
          <Button type="button" intent="primary" onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? 'Inahifadhi...' : isEditing ? 'Sasisha' : 'Unda Mtumiaji'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {generatedPass && (
          <div className="p-4 bg-success/10 border border-success/20 text-success rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Key size={16} /> Nenosiri la Muda Limetengenezwa
            </div>
            <p className="text-xs">Nakili nenosiri hili na umpe mtumiaji. Halitaonyeshwa tena!</p>
            <div className="p-2 bg-background font-mono text-sm font-bold rounded border border-success/30 select-all">
              {generatedPass}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Jina la Kwanza</FieldLabel>
            <Input
              value={formData.firstName}
              onChange={(e: any) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="First Name"
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel required>Jina la Mwisho</FieldLabel>
            <Input
              value={formData.lastName}
              onChange={(e: any) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Last Name"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Jina la Mtumiaji (Username)</FieldLabel>
            <Input
              value={formData.username}
              onChange={(e: any) => setFormData((p) => ({ ...p, username: e.target.value.toLowerCase().trim() }))}
              placeholder="username"
              disabled={isEditing}
            />
          </Field>
          <Field>
            <FieldLabel>Namba ya Simu (Si lazima)</FieldLabel>
            <PhoneInput
              value={formData.phone}
              onChange={(val: any) => setFormData((p) => ({ ...p, phone: typeof val === 'string' ? val : val?.target?.value || '' }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Jukumu (Role Preset)</FieldLabel>
            <select
              value={formData.rolePreset}
              onChange={(e) => handlePresetChange(e.target.value as RolePreset)}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">Admin</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="sudo">SUDO (Owner)</option>
            </select>
          </Field>

          <Field>
            <FieldLabel required>Tawi (Branch)</FieldLabel>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData((p) => ({ ...p, branchId: e.target.value }))}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.branch_code})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-between p-3 bg-panel-subtle rounded-lg border border-border">
          <div>
            <span className="text-xs font-bold text-foreground block">Superintendent</span>
            <span className="text-[10px] text-muted-foreground">Je mtumiaji huyu ni msimamizi mkuu wa kitaalamu?</span>
          </div>
          <input
            type="checkbox"
            checked={formData.isSuperintendent}
            onChange={(e) => setFormData((p) => ({ ...p, isSuperintendent: e.target.checked }))}
            className="w-4 h-4 rounded border-border text-primary accent-primary"
          />
        </div>

        {!isEditing && (
          <div className="p-3 bg-panel-subtle rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Nenosiri la Muda</span>
              <Button type="button" intent="neutral" size="sm" onClick={handleGeneratePassword}>
                Tengeneza (Generate)
              </Button>
            </div>
            <Input
              value={formData.tempPassword}
              onChange={(e: any) => setFormData((p) => ({ ...p, tempPassword: e.target.value }))}
              placeholder="Ingiza au tengeneza nenosiri"
            />
          </div>
        )}

        {formData.rolePreset !== 'sudo' && (
          <div className="pt-2 border-t border-border/40 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Ruhusa Maalum (Permissions)
            </h4>
            <div className="grid grid-cols-1 gap-2 bg-panel-subtle p-3 rounded-card border border-border/50 max-h-48 overflow-y-auto">
              {ALL_PERMISSIONS.map(({ key, label }) => {
                const checked = formData.permissions.includes(key);
                return (
                  <label key={key} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-panel/50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const newPerms = e.target.checked
                          ? [...formData.permissions, key]
                          : formData.permissions.filter((p) => p !== key);
                        setFormData((p) => ({ ...p, permissions: newPerms }));
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
