-- Persist laboratory equipment and quality control history without changing
-- existing order, sample, result, or catalog records.
CREATE TABLE lab_qc_equipment (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  asset_tag TEXT,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','maintenance','out_of_service')),
  last_calibrated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_lab_qc_equipment_scope ON lab_qc_equipment(workspace_id, branch_id);

CREATE TABLE lab_qc_record (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  equipment_id TEXT NOT NULL REFERENCES lab_qc_equipment(id),
  control_name TEXT NOT NULL,
  lot_number TEXT,
  observed_value TEXT NOT NULL,
  expected_range TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('pass','fail')),
  performed_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  performed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_lab_qc_record_scope ON lab_qc_record(workspace_id, branch_id, performed_at);
