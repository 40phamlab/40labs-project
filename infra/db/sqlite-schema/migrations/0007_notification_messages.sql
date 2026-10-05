-- 40LabsCore — SQLite Schema, Migration 0005 (notification messages and attachments)

PRAGMA foreign_keys = ON;

-- Add new columns to notifications table if they don't already exist
ALTER TABLE notifications ADD COLUMN channel TEXT NOT NULL DEFAULT 'amob' CHECK (channel IN ('amob','whatsapp','sms','email'));
ALTER TABLE notifications ADD COLUMN content_type TEXT;
ALTER TABLE notifications ADD COLUMN html_content TEXT;
ALTER TABLE notifications ADD COLUMN plain_text_content TEXT;

CREATE TABLE notification_messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  content_type TEXT NOT NULL DEFAULT 'text',
  body TEXT NOT NULL,
  html_content TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_notification_messages_workspace ON notification_messages(workspace_id);
CREATE INDEX idx_notification_messages_notification ON notification_messages(notification_id);
CREATE INDEX idx_notification_messages_sent_at ON notification_messages(sent_at);

CREATE TABLE message_attachments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  message_id TEXT NOT NULL REFERENCES notification_messages(id) ON DELETE CASCADE,
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

CREATE INDEX idx_message_attachments_workspace ON message_attachments(workspace_id);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- Backfill: for each existing notification, insert one incoming message from body
INSERT INTO notification_messages (id, workspace_id, branch_id, notification_id, direction, content_type, body, html_content, status, sent_at, created_at, updated_at)
SELECT
  'msg_backfill_' || id,
  workspace_id,
  branch_id,
  id,
  'incoming',
  COALESCE(content_type, 'text'),
  body,
  html_content,
  CASE WHEN status = 'read' THEN 'read' ELSE 'queued' END,
  COALESCE(received_at, created_at),
  created_at,
  updated_at
FROM notifications
WHERE NOT EXISTS (
  SELECT 1 FROM notification_messages WHERE notification_messages.notification_id = notifications.id
);
