import { BaseEntity } from './common';

export type UserRole = 'sudo' | 'staff';

// Staff are added ONLY by a SUDO owner — never self-registered.
// This type deliberately has no "signup" shape; creation always originates
// server-side from an authenticated SUDO session.
export interface StaffPermissionSet {
  can_update_stock: boolean;
  can_adjust_stock: boolean;      // PIN-gated action regardless
  can_issue_refund: boolean;      // PIN-gated action regardless
  can_approve_po: boolean;        // PIN-gated action regardless
  can_add_lab_sample: boolean;
  can_override_lab_result: boolean; // PIN-gated action regardless
  can_view_reports: boolean;
}

export interface User extends BaseEntity {
  full_name: string;
  role: UserRole;
  pin_hash: string; // never transmit/store plaintext PIN
  permissions: StaffPermissionSet | null; // null for sudo (implicitly all)
  active: boolean;
}

// Device pairing — Orbit Worker, QR-code, LAN-only, persistent trust
// for CONNECTIVITY only. Never a substitute for PIN gates.
export interface PairedDevice extends BaseEntity {
  user_id: string;
  device_label: string;
  paired_at: string;
  last_connected_at: string | null;
  status: 'active' | 'blocked' | 'removed';
}