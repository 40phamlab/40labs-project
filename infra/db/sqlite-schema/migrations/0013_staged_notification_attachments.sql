-- Attachments are staged before a message is sent. The send transaction binds
-- them to the newly-created message; NULL therefore means an unsent draft.
CREATE TABLE message_attachments_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  message_id TEXT REFERENCES notification_messages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'file', 'audio')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO message_attachments_new SELECT * FROM message_attachments;
DROP TABLE message_attachments;
ALTER TABLE message_attachments_new RENAME TO message_attachments;
CREATE INDEX idx_message_attachments_workspace ON message_attachments(workspace_id);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
