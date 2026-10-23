-- Stage-level file attachments for laboratory workflow runs
CREATE TABLE IF NOT EXISTS lab_stage_attachment (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES lab_workflow_run(id),
  node_id TEXT NOT NULL,
  sample_id TEXT,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_stage_attachment_scope ON lab_stage_attachment(workspace_id, branch_id, run_id, node_id);
