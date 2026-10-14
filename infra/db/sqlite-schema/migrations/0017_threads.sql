-- 40Labs Core — SQLite Schema, Migration 0017 (Real Threads, one per counterparty)

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  counterparty_type TEXT NOT NULL CHECK (counterparty_type IN ('customer','business','gov','marketing','system')),
  counterparty_key TEXT NOT NULL,
  counterparty_id TEXT,
  display_name TEXT NOT NULL,
  last_message_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_message_preview TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(workspace_id, counterparty_key)
);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_key ON threads(workspace_id, counterparty_key);
CREATE INDEX IF NOT EXISTS idx_threads_workspace_branch ON threads(workspace_id, branch_id);

ALTER TABLE notification_messages ADD COLUMN thread_id TEXT REFERENCES threads(id);
CREATE INDEX IF NOT EXISTS idx_notification_messages_thread_id ON notification_messages(thread_id);

ALTER TABLE notifications ADD COLUMN thread_id TEXT REFERENCES threads(id);
CREATE INDEX IF NOT EXISTS idx_notifications_thread_id ON notifications(thread_id);

-- Backfill existing notifications into threads
INSERT OR IGNORE INTO threads (id, workspace_id, branch_id, counterparty_type, counterparty_key, counterparty_id, display_name, last_message_at, last_message_preview, archived, created_at, updated_at)
SELECT
  'thread_' || hex(randomblob(8)),
  workspace_id,
  branch_id,
  CASE
    WHEN category = 'gov' THEN 'gov'
    WHEN category = 'marketing' THEN 'marketing'
    WHEN category = 'business' THEN 'business'
    ELSE 'customer'
  END AS counterparty_type,
  COALESCE(
    CASE WHEN related_entity_type = 'customer' AND related_entity_id IS NOT NULL THEN 'customer:' || related_entity_id END,
    CASE WHEN sender_business_id IS NOT NULL THEN 'business:' || sender_business_id END,
    category || ':' || lower(trim(sender_name))
  ) AS counterparty_key,
  COALESCE(
    CASE WHEN related_entity_type = 'customer' THEN related_entity_id END,
    sender_business_id
  ) AS counterparty_id,
  sender_name AS display_name,
  COALESCE(received_at, created_at) AS last_message_at,
  body AS last_message_preview,
  CASE WHEN status = 'archived' THEN 1 ELSE 0 END AS archived,
  created_at,
  updated_at
FROM notifications;

UPDATE notifications
SET thread_id = (
  SELECT t.id FROM threads t
  WHERE t.workspace_id = notifications.workspace_id
    AND t.counterparty_key = COALESCE(
      CASE WHEN notifications.related_entity_type = 'customer' AND notifications.related_entity_id IS NOT NULL THEN 'customer:' || notifications.related_entity_id END,
      CASE WHEN notifications.sender_business_id IS NOT NULL THEN 'business:' || notifications.sender_business_id END,
      notifications.category || ':' || lower(trim(notifications.sender_name))
    )
);

UPDATE notification_messages
SET thread_id = (
  SELECT n.thread_id FROM notifications n WHERE n.id = notification_messages.notification_id
);
