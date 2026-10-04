// [PHASE: MVP]
import { BaseEntity } from './common';

export interface AllergyItem {
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

// Single shared Customer entity — referenced by Sales AND Lab, never duplicated.
export interface Customer extends BaseEntity {
  full_name: string;
  phone: string;
  email: string | null;
  outstanding_balance: number; // TZS, computed/adjustable
  notes: string | null; // Legacy / general notes

  // --- Structured Medical Profile ---
  dob?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  blood_group?: string | null;
  allergies?: string | AllergyItem[] | null;
  chronic_conditions?: string | string[] | null;
  current_medications?: string | string[] | null;
  emergency_contact?: string | EmergencyContact | null;
  ward_district?: string | null;
  pharmacy_notes?: string | null; // Non-clinical pharmacy notes
  archived_at?: string | null;

  // --- Reserved for future expansion / aMob ---
  amob_patient_id: string | null;
}
