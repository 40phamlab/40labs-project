import { BaseEntity } from './common';

export type LabOrderStatus = 'pending' | 'sample_collected' | 'result_entered' | 'report_ready' | 'unsolved' | 'cancelled';
export type LabSampleStatus = 'collected' | 'insufficient' | 'declined' | 'used' | 'removed';
export type ExpirySource = 'catalog' | 'manual';
export type SampleEventType =
  | 'collected'
  | 'received'
  | 'processing'
  | 'result_entered'
  | 'recollect_requested'
  | 'expiry_overridden'
  | 'status_changed'
  | 'reported'
  | 'forwarded';

export interface LabOrder extends BaseEntity {
  customer_id: string; // same shared Customer entity as Sales
  sale_id: string | null; // optional link to a prescription/dispensing event
  ordered_by_user_id: string;
  status: LabOrderStatus;
  test_catalog_id: string;
}

export interface LabSample extends BaseEntity {
  lab_order_id: string;
  collected_by_user_id: string;
  collected_at: string;
  sample_label: string;
  status: LabSampleStatus;
  expires_at: string | null;
  expiry_source: ExpirySource | null;
}

export interface SampleEvent extends BaseEntity {
  sample_id: string;
  event_type: SampleEventType;
  actor_user_id: string;
  payload_json: string | null;
  occurred_at: string;
}

export interface LabResult extends BaseEntity {
  lab_order_id: string;
  entered_by_user_id: string;
  value: string;
  reference_range: string | null;
  is_out_of_range: boolean;
  override_authorized_by_user_id: string | null; // PIN-gated if out-of-range override
}

export interface LabReport extends BaseEntity {
  lab_order_id: string;
  generated_at: string;
  pdf_path: string; // local Typst-generated file path, synced as a blob later
}

export interface TestCatalogEntry extends BaseEntity {
  name: string;
  category: string;
  reference_range: string | null;
  price: number;
  stability_hours: number | null;
}

export interface LabQcEquipment extends BaseEntity {
  name: string;
  manufacturer: string | null;
  model: string | null;
  asset_tag: string | null;
  status: 'operational' | 'maintenance' | 'out_of_service';
  last_calibrated_at: string | null;
}

export interface LabQcRecord extends BaseEntity {
  equipment_id: string;
  control_name: string;
  lot_number: string | null;
  observed_value: string;
  expected_range: string;
  outcome: 'pass' | 'fail';
  performed_by_user_id: string;
  performed_at: string;
}

export interface LabQcData {
  equipment: LabQcEquipment[];
  records: LabQcRecord[];
}
