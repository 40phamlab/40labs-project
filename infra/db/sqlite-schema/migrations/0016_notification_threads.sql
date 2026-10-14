CREATE TABLE thread (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  counterparty_type TEXT NOT NULL CHECK (counterparty_type IN ('customer','business','gov','marketing','system')),
  counterparty_id TEXT,
  display_name TEXT NOT NULL,
  last_message_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unread_count INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT 0,
  last_message_preview TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_thread_workspace ON thread(workspace_id, branch_id);

ALTER TABLE notifications ADD COLUMN thread_id TEXT REFERENCES thread(id);
CREATE INDEX idx_notification_thread ON notifications(thread_id);
