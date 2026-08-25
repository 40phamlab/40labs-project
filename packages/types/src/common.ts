// Base fields every table/entity carries from day one — NO EXCEPTIONS.
// branch_id is reserved/unenforced until v3.5 multi-branch, but it exists
// on every entity now so no schema migration is needed later.

export type ISODateString = string; // always store/transmit as ISO 8601

export interface BaseEntity {
  id: string;
  workspace_id: string;
  branch_id: string; // reserved — single-branch businesses get one default branch
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Business ID format: AFYA-XXXX, minted once at registration, never reissued.
export type BusinessId = string;

export type Currency = 'TZS'; // single-currency for MVP; do not widen without a decision