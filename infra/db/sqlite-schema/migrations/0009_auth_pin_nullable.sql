-- 40LabsCore — SQLite Schema, Migration 0009 (auth pin nullable & table rebuild)
-- Ensure pin_hash is nullable on user_credential, converting empty string to NULL.

PRAGMA foreign_keys = OFF;

CREATE TABLE user_credential_new (
  user_id TEXT PRIMARY KEY REFERENCES app_user(id),
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT,
  failed_password_attempts INTEGER NOT NULL DEFAULT 0,
  failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  pin_changed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO user_credential_new
SELECT user_id, workspace_id, branch_id, password_hash, CASE WHEN pin_hash = '' THEN NULL ELSE pin_hash END, failed_password_attempts, failed_pin_attempts, locked_until, password_changed_at, pin_changed_at, created_at, updated_at
FROM user_credential;

DROP TABLE user_credential;
ALTER TABLE user_credential_new RENAME TO user_credential;

CREATE INDEX idx_user_credential_workspace ON user_credential(workspace_id, branch_id);

PRAGMA foreign_keys = ON;
