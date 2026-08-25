import { BaseEntity } from './common';

export type LabOrderStatus = 'pending' | 'sample_collected' | 'result_entered' | 'report_ready' | 'unsolved';

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
}