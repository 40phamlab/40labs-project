import { BaseEntity } from './common';

// Single shared Customer entity — referenced by Sales AND Lab, never duplicated.
export interface Customer extends BaseEntity {
  full_name: string;
  phone: string;
  email: string | null;
  outstanding_balance: number; // TZS, computed/adjustable (adjustment is PIN-gated)
  notes: string | null;

  // --- Reserved for future aMob linkage — inert until aMob ships (post-MVP) ---
  amob_patient_id: string | null; // null in MVP; do not build UI reading/writing this
}