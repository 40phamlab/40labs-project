import { BaseEntity } from './common';

export type UserRole = 'sudo' | 'staff';

export type RolePreset = 'sudo' | 'admin' | 'pharmacist' | 'lab_technician';

export type PermissionKey =
  | 'inventory.adjust'
  | 'users.manage'
  | 'branches.manage'
  | 'settings.manage'
  | 'sales.refund'
  | 'interaction.override'
  | 'purchases.approve'
  | 'sales.discount'
  | 'can_update_stock'
  | 'can_adjust_stock'
  | 'can_issue_refund'
  | 'can_approve_po'
  | 'can_add_lab_sample'
  | 'can_override_lab_result'
  | 'can_view_reports';

export const FLAGGED_PERMISSIONS: PermissionKey[] = ['branches.manage'];

export interface Owner extends BaseEntity {
  first_name: string;
  last_name: string;
  phone: string;
  phone_verified_at: string | null;
  email: string | null;
}

export interface User extends BaseEntity {
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  role_preset: RolePreset;
  is_superintendent: boolean;
  active: boolean;
  owner_id: string | null;
  must_change_credentials: boolean;
  last_login_at: string | null;
  created_by_user_id: string | null;
  // Legacy / UI optional helper fields
  pin_hash?: string;
  permissions?: StaffPermissionSet | null;
  contacts?: string | null;
  location?: string | null;
}

export interface UserCredential extends BaseEntity {
  user_id: string;
  password_hash: string;
  pin_hash: string;
  failed_password_attempts: number;
  failed_pin_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
  pin_changed_at: string | null;
}

export interface RecoveryCode {
  id: string;
  workspace_id: string;
  branch_id: string;
  user_id: string;
  batch_id: string;
  code_hash: string;
  used_at: string | null;
  invalidated_at: string | null;
  created_at: string;
}

export interface BoundDevice extends BaseEntity {
  device_label: string;
  public_key: string;
  bound_by_user_id: string;
  bound_at: string;
  last_sync_at: string | null;
  status: 'active' | 'revoked';
  revoked_at: string | null;
}

export interface PermissionGrant {
  id: string;
  workspace_id: string;
  branch_id: string;
  user_id: string;
  permission: string;
  granted_by_user_id: string;
  created_at: string;
}

// Staff permission set for legacy compatibility / UI display
export interface StaffPermissionSet {
  can_update_stock: boolean;
  can_adjust_stock: boolean;
  can_issue_refund: boolean;
  can_approve_po: boolean;
  can_add_lab_sample: boolean;
  can_override_lab_result: boolean;
  can_view_reports: boolean;
  'branches.manage'?: boolean;
  [key: string]: boolean | undefined;
}

// Device pairing — Orbit Worker, QR-code, LAN-only
export interface PairedDevice extends BaseEntity {
  user_id: string;
  device_label: string;
  device_type: string;
  permissions_json: string;
  credential_hash?: string | null;
  paired_at: string;
  last_connected_at: string | null;
  status: 'active' | 'blocked' | 'removed';
}
