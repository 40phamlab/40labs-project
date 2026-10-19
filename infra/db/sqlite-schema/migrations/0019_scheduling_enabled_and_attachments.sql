-- 40LabsCore — SQLite Schema, Migration 0019 (scheduling enabled & attachments)
PRAGMA foreign_keys = ON;

ALTER TABLE schedules ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1));

CREATE TABLE schedule_attachments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('report', 'file')),
  report TEXT,
  period_token TEXT,
  period_from TEXT,
  period_to TEXT,
  file_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedule_attachments_schedule ON schedule_attachments(schedule_id);
