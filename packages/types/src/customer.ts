import { BaseEntity } from './common';

// Single shared Customer entity — referenced by Sales AND Lab, never duplicated.
export interface Customer extends BaseEntity {
  full_name: string;
  phone: string;
  email: string | null;
  outstanding_balance: number; // TZS, computed/adjustable (adjustment is PIN-gated)
  notes: string | null;

  // --- CRM Fields (Reserved for future expansion) ---
  // TODO(Sairiamu): No schema fields yet per PRD Open Question,
  // but adding here to maintain "schema ready now" philosophy.
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  problem?: string | null;
  subscription?: string | null;
  relation?: string | null;
  deals?: string | null;

  // --- Reserved for future aMob linkage — inert until aMob ships (post-MVP) ---
  amob_patient_id: string | null; // null in MVP; do not build UI reading/writing this
}