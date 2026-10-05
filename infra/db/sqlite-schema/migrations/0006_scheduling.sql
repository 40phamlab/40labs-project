-- 40LabsCore — SQLite Schema, Migration 0004 (scheduling)
-- Stores scheduled outbound communications (reports, reminders, refill
-- notices) queued for delivery across one or more channels.
--
-- NOTE: `category` and `schedule_type` are intentionally NOT constrained
-- with an inline CHECK. Wireframe review (Sept 2026) surfaced an unresolved
-- overlap between the Categories list (reports/marketing/patients/gov) and
-- the list-panel tabs (report/reminder/refill) — pending confirmation from
-- Sairiamu. Per the lab_order.status precedent, an inline CHECK on a
-- still-ambiguous enum forces a full table-recreate migration to fix later,
-- so these two columns are app-layer validated only until confirmed.
-- `status` and `repeat_interval` ARE constrained — those domains are settled.

PRAGMA foreign_keys = ON;

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  channels TEXT NOT NULL,
  recipient_scope TEXT NOT NULL CHECK (recipient_scope IN
    ('all','customers','staff','subscribers','pharmacies','custom')),
  recipient_ids TEXT,
  message_body TEXT NOT NULL DEFAULT '',
  attachments TEXT,
  scheduled_at TEXT NOT NULL,
  repeat_interval TEXT NOT NULL DEFAULT 'none' CHECK (repeat_interval IN
    ('none','daily','weekly','monthly')),
  repeat_until TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','sent','failed','cancelled')),
  sent_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_schedules_workspace ON schedules(workspace_id);
CREATE INDEX idx_schedules_category ON schedules(category);
CREATE INDEX idx_schedules_type ON schedules(schedule_type);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_scheduled_at ON schedules(scheduled_at);
