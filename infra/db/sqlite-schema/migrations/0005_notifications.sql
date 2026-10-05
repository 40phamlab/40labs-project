-- 40LabsCore — SQLite Schema, Migration 0003 (notifications)
-- Stores local offline-generated and remote-synced notifications.

PRAGMA foreign_keys = ON;

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gov', 'customers', 'marketing', 'business')),
  source_type TEXT NOT NULL CHECK (source_type IN ('system', 'remote')),
  sender_name TEXT NOT NULL,
  sender_business_id TEXT REFERENCES business(business_id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  related_entity_type TEXT,
  related_entity_id TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_received_at ON notifications(received_at);
CREATE INDEX idx_notifications_sender_business ON notifications(sender_business_id);
