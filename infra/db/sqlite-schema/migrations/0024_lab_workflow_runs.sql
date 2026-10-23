-- Persistent workflow execution runs and steps for laboratory procedures
CREATE TABLE IF NOT EXISTS lab_workflow_run (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('running','completed','blocked','cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_workflow_run_scope ON lab_workflow_run(workspace_id, branch_id, order_id);

CREATE TABLE IF NOT EXISTS lab_workflow_run_step (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES lab_workflow_run(id),
  node_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','active','done','skipped','blocked')),
  completed_by TEXT,
  completed_at TEXT,
  block_reason TEXT,
  notes TEXT,
  measurements_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_workflow_run_step_scope ON lab_workflow_run_step(workspace_id, branch_id, run_id);
