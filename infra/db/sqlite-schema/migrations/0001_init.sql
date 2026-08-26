-- 40LabsCore — SQLite Schema, Migration 0001 (init)
-- Source: mirrors packages/types exactly. If they disagree, this file
-- and packages/types must be reconciled together — never let one drift.
-- Money convention: all monetary columns are INTEGER, stored in the
-- smallest currency unit (TZS has no subunit in practice, so this is
-- whole TZS as INTEGER) — never REAL, to avoid floating point drift
-- on financial data.
-- IDs: TEXT (UUID v4, generated app-side) — never AUTOINCREMENT, since
-- offline-first means multiple branches may generate records with zero
-- connectivity and sequential integers would collide on sync.

PRAGMA foreign_keys = ON;

-- ============================================================
-- BUSINESS / WORKSPACE / BRANCH
-- ============================================================

CREATE TABLE business (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE, -- canonical AFYA-XXXX, minted once
  name TEXT NOT NULL,
  tin TEXT,
  tmda_number TEXT,
  role_scopes TEXT NOT NULL DEFAULT '["pharmacy"]', -- JSON array: pharmacy|lab|supplier
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','class_1','class_2','class_3','class_4_enterprise')),
  -- tier is CALCULATED server-side from the sale ledger — never write this
  -- directly from a UI form. See services/api-core once it exists.
  contact_mobile TEXT NOT NULL,
  contact_email TEXT,
  contact_whatsapp TEXT,
  address_region TEXT,
  address_district TEXT,
  address_place TEXT,
  logo_url TEXT,
  appearance_mode TEXT NOT NULL DEFAULT 'light' CHECK (appearance_mode IN ('light','dark')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE branch (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES business(business_id),
  name TEXT NOT NULL,
  location TEXT,
  branch_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  contacts TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- USERS / DEVICES
-- ============================================================

CREATE TABLE app_user (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sudo','staff')),
  pin_hash TEXT NOT NULL, -- never store plaintext PIN
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Staff permission set — one row per staff user. SUDO users have no row
-- here (app logic treats missing row = implicit all-permissions).
CREATE TABLE staff_permission_set (
  user_id TEXT PRIMARY KEY REFERENCES app_user(id),
  can_update_stock INTEGER NOT NULL DEFAULT 0 CHECK (can_update_stock IN (0,1)),
  can_adjust_stock INTEGER NOT NULL DEFAULT 0 CHECK (can_adjust_stock IN (0,1)),
  can_issue_refund INTEGER NOT NULL DEFAULT 0 CHECK (can_issue_refund IN (0,1)),
  can_approve_po INTEGER NOT NULL DEFAULT 0 CHECK (can_approve_po IN (0,1)),
  can_add_lab_sample INTEGER NOT NULL DEFAULT 0 CHECK (can_add_lab_sample IN (0,1)),
  can_override_lab_result INTEGER NOT NULL DEFAULT 0 CHECK (can_override_lab_result IN (0,1)),
  can_view_reports INTEGER NOT NULL DEFAULT 0 CHECK (can_view_reports IN (0,1))
);

CREATE TABLE paired_device (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES app_user(id),
  device_label TEXT NOT NULL,
  paired_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_connected_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','removed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- CUSTOMER (shared — POS + Lab, never duplicated)
-- ============================================================

CREATE TABLE customer (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  outstanding_balance INTEGER NOT NULL DEFAULT 0, -- TZS, smallest unit
  notes TEXT,
  -- Reserved for aMob — inert until aMob ships (post-MVP). Do not build
  -- UI reading/writing this column.
  amob_patient_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_customer_phone ON customer(phone);
CREATE INDEX idx_customer_workspace ON customer(workspace_id, branch_id);

-- ============================================================
-- MEDICINE / INVENTORY (shared — never duplicated per module)
-- ============================================================

CREATE TABLE medicine (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL, -- "pack", "tablet", "bottle", etc.
  is_controlled_substance INTEGER NOT NULL DEFAULT 0 CHECK (is_controlled_substance IN (0,1)),
  requires_prescription INTEGER NOT NULL DEFAULT 0 CHECK (requires_prescription IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_medicine_name ON medicine(name);

CREATE TABLE inventory_item (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  medicine_id TEXT NOT NULL REFERENCES medicine(id),
  batch_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL, -- ISO date
  buy_price INTEGER NOT NULL,  -- TZS, smallest unit
  sell_price INTEGER NOT NULL, -- TZS, smallest unit
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  cold_chain_required INTEGER NOT NULL DEFAULT 0 CHECK (cold_chain_required IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_inventory_medicine ON inventory_item(medicine_id);
CREATE INDEX idx_inventory_expiry ON inventory_item(expiry_date);
CREATE INDEX idx_inventory_branch ON inventory_item(workspace_id, branch_id);

CREATE TABLE stock_adjustment (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
  adjusted_by_user_id TEXT NOT NULL REFERENCES app_user(id), -- PIN-gated actor
  delta INTEGER NOT NULL, -- positive or negative
  reason TEXT NOT NULL,
  audit_log_id TEXT NOT NULL, -- app-layer enforced link to audit_log — see GOTCHAS.md
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- SALES
-- ============================================================

CREATE TABLE sale (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_id TEXT REFERENCES customer(id), -- null = walk-in
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','mobile_money','card','credit')),
  discount_amount INTEGER NOT NULL DEFAULT 0,
  discount_authorized_by_user_id TEXT REFERENCES app_user(id), -- set if over PIN threshold
  tax_amount INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  synced_at TEXT, -- null = still queued for Postgres sync
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_sale_customer ON sale(customer_id);
CREATE INDEX idx_sale_synced ON sale(synced_at); -- fast lookup of unsynced rows
CREATE INDEX idx_sale_branch ON sale(workspace_id, branch_id);

CREATE TABLE sale_line (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sale(id),
  inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
  medicine_id TEXT NOT NULL REFERENCES medicine(id),
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  dispensed_by_user_id TEXT NOT NULL REFERENCES app_user(id), -- superintendent pharmacist record
  is_prescription_dispense INTEGER NOT NULL DEFAULT 0 CHECK (is_prescription_dispense IN (0,1))
);

CREATE INDEX idx_sale_line_sale ON sale_line(sale_id);

-- ============================================================
-- FISCAL (TRA EFD/VFD outbox)
-- ============================================================

CREATE TABLE fiscal_receipt (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  sale_id TEXT NOT NULL UNIQUE REFERENCES sale(id), -- exactly one per sale
  fiscal_device_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','submitted','confirmed','failed')),
  local_signature TEXT NOT NULL, -- always present, generated offline at sale time
  tra_receipt_number TEXT, -- null until confirmed
  queued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  submitted_at TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  -- Max offline buffering window is an OPEN COMPLIANCE QUESTION
  -- (PROGRESS.md #5). Do not enforce a hardcoded expiry until confirmed
  -- with TRA directly — column exists so the limit can be applied later
  -- without a schema migration.
  buffering_window_hours INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_fiscal_status ON fiscal_receipt(status); -- fast lookup of queued/failed for retry job

-- ============================================================
-- LAB MODULE (the moat — Order -> Sample -> Result -> Report)
-- ============================================================

CREATE TABLE test_catalog_entry (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_range TEXT,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE lab_order (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customer(id), -- same shared Customer as Sales
  sale_id TEXT REFERENCES sale(id), -- optional link to prescription/dispensing event
  ordered_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sample_collected','result_entered','report_ready','unsolved')),
  test_catalog_id TEXT NOT NULL REFERENCES test_catalog_entry(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_lab_order_customer ON lab_order(customer_id);
CREATE INDEX idx_lab_order_status ON lab_order(status);

CREATE TABLE lab_sample (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  lab_order_id TEXT NOT NULL REFERENCES lab_order(id),
  collected_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  collected_at TEXT NOT NULL,
  sample_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE lab_result (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  lab_order_id TEXT NOT NULL REFERENCES lab_order(id),
  entered_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  value TEXT NOT NULL,
  reference_range TEXT,
  is_out_of_range INTEGER NOT NULL DEFAULT 0 CHECK (is_out_of_range IN (0,1)),
  override_authorized_by_user_id TEXT REFERENCES app_user(id), -- PIN-gated if out-of-range override
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE lab_report (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  lab_order_id TEXT NOT NULL REFERENCES lab_order(id),
  generated_at TEXT NOT NULL,
  pdf_path TEXT NOT NULL, -- local Typst-generated file path
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- PURCHASES / SUPPLIERS
-- ============================================================

CREATE TABLE supplier (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  business_id TEXT NOT NULL, -- a Business with the 'supplier' role scope
  -- Verification badges are READ-ONLY here — review workflow lives in
  -- Admin Web App. Never write these from core-desktop.
  tmda_verified INTEGER NOT NULL DEFAULT 0 CHECK (tmda_verified IN (0,1)),
  tra_verified INTEGER NOT NULL DEFAULT 0 CHECK (tra_verified IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE purchase_order (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES supplier(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','completed','cancelled')),
  total_cost INTEGER NOT NULL DEFAULT 0,
  approved_by_user_id TEXT REFERENCES app_user(id), -- PIN-gated if above threshold
  submitted_at TEXT, -- null while draft/offline-queued
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE purchase_order_line (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_order(id),
  medicine_id TEXT NOT NULL REFERENCES medicine(id),
  quantity INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL
);

CREATE INDEX idx_po_supplier ON purchase_order(supplier_id);
CREATE INDEX idx_po_status ON purchase_order(status);

-- ============================================================
-- AUDIT LOG — immutable, append-only, NO EXCEPTIONS
-- ============================================================

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'stock_adjustment','refund','po_approval','lab_result_override',
    'discount_authorization','pin_change','password_change',
    'device_block','device_remove'
  )),
  performed_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  target_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}', -- JSON
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  -- Deliberately NO updated_at — this row never changes after insert.
);

CREATE INDEX idx_audit_target ON audit_log(target_entity_type, target_entity_id);
CREATE INDEX idx_audit_actor ON audit_log(performed_by_user_id);

-- Enforce immutability at the DB layer, not just app discipline.
-- Verified: attempting UPDATE or DELETE against this table raises
-- an IntegrityError, tested directly against a live SQLite engine.
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only: UPDATE is not permitted');
END;

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only: DELETE is not permitted');
END;

-- ============================================================
-- RESERVED — dormant until aMob / Web App ship (post-MVP)
-- ============================================================

CREATE TABLE dormant_amob_profile (
  business_id TEXT PRIMARY KEY REFERENCES business(business_id),
  storefront_enabled INTEGER NOT NULL DEFAULT 0 CHECK (storefront_enabled IN (0,1)), -- always 0 in MVP
  display_name TEXT,
  availability_open TEXT,
  availability_close TEXT,
  availability_days TEXT, -- JSON array
  service_e_pharmacy INTEGER NOT NULL DEFAULT 0 CHECK (service_e_pharmacy IN (0,1)),
  service_advice INTEGER NOT NULL DEFAULT 0 CHECK (service_advice IN (0,1)),
  service_education INTEGER NOT NULL DEFAULT 0 CHECK (service_education IN (0,1)),
  service_consultancy INTEGER NOT NULL DEFAULT 0 CHECK (service_consultancy IN (0,1)),
  service_delivery INTEGER NOT NULL DEFAULT 0 CHECK (service_delivery IN (0,1))
);

CREATE TABLE dormant_web_app_listing (
  business_id TEXT PRIMARY KEY REFERENCES business(business_id),
  listing_enabled INTEGER NOT NULL DEFAULT 0 CHECK (listing_enabled IN (0,1)), -- always 0 in MVP
  forty_labs_verified INTEGER NOT NULL DEFAULT 0 CHECK (forty_labs_verified IN (0,1)),
  tmda_registered INTEGER NOT NULL DEFAULT 0 CHECK (tmda_registered IN (0,1))
);