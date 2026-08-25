import { BaseEntity } from './common';

export type FiscalReceiptStatus = 'queued' | 'submitted' | 'confirmed' | 'failed';

// Every Sale produces exactly one of these. Signed locally at sale time,
// queued in the local outbox, submitted to TRA when connectivity returns.
export interface FiscalReceipt extends BaseEntity {
  sale_id: string;
  fiscal_device_id: string | null; // e.g. INCOTEX/DATECS device reference
  status: FiscalReceiptStatus;
  local_signature: string; // generated offline, always present
  tra_receipt_number: string | null; // null until confirmed
  queued_at: string;
  submitted_at: string | null;
  retry_count: number;
  // Max offline buffering window is an OPEN COMPLIANCE QUESTION — see
  // PROGRESS.md item #5. Do not hardcode a retry/expiry limit until confirmed
  // directly with TRA. This field exists so the limit can be applied later
  // without a schema change.
  buffering_window_hours: number | null;
}