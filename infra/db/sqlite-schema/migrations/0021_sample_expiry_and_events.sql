-- Add expiry fields to lab_sample and test_catalog_entry, and create append-only sample_event table.

ALTER TABLE lab_sample ADD COLUMN expires_at TEXT;
ALTER TABLE lab_sample ADD COLUMN expiry_source TEXT CHECK (expiry_source IN ('catalog', 'manual'));

ALTER TABLE test_catalog_entry ADD COLUMN stability_hours INTEGER;

CREATE TABLE sample_event (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  sample_id TEXT NOT NULL REFERENCES lab_sample(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('collected','received','processing','result_entered','recollect_requested','expiry_overridden','status_changed','reported','forwarded')),
  actor_user_id TEXT NOT NULL REFERENCES app_user(id),
  payload_json TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_sample_event_sample ON sample_event(sample_id);
CREATE INDEX idx_sample_event_scope ON sample_event(workspace_id, branch_id, occurred_at);

CREATE TRIGGER trg_sample_event_no_update
BEFORE UPDATE ON sample_event
BEGIN
  SELECT RAISE(ABORT, 'sample_event is append-only: UPDATE is not permitted');
END;

CREATE TRIGGER trg_sample_event_no_delete
BEFORE DELETE ON sample_event
BEGIN
  SELECT RAISE(ABORT, 'sample_event is append-only: DELETE is not permitted');
END;
