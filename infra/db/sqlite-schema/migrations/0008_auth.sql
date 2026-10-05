-- 40LabsCore — SQLite Schema, Migration 0008 (auth)
-- Auth entities: user credentials, recovery codes, bound devices, permission grants,
-- and business onboarding extension columns.
-- System Rule: Every new table carries workspace_id + branch_id.

PRAGMA foreign_keys = ON;

-- ============================================================
-- USER CREDENTIALS
-- ============================================================

CREATE TABLE user_credential (
  user_id TEXT PRIMARY KEY REFERENCES app_user(id),
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  failed_password_attempts INTEGER NOT NULL DEFAULT 0,
  failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  pin_changed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_user_credential_workspace ON user_credential(workspace_id, branch_id);

-- ============================================================
-- RECOVERY CODES
-- ============================================================

CREATE TABLE recovery_code (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES app_user(id),
  batch_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  invalidated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_recovery_code_user ON recovery_code(user_id);
CREATE INDEX idx_recovery_code_batch ON recovery_code(batch_id);

-- ============================================================
-- BOUND DEVICES (Hardware/PKI device binding — distinct from Orbit paired_device)
-- ============================================================

CREATE TABLE bound_device (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_label TEXT NOT NULL,
  public_key TEXT NOT NULL,
  bound_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  bound_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_sync_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_bound_device_workspace ON bound_device(workspace_id, branch_id);
CREATE INDEX idx_bound_device_user ON bound_device(bound_by_user_id);

-- ============================================================
-- PERMISSION GRANTS
-- ============================================================

CREATE TABLE permission_grant (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES app_user(id),
  permission TEXT NOT NULL,
  granted_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(user_id, permission)
);

CREATE INDEX idx_permission_grant_user ON permission_grant(user_id);

-- ============================================================
-- BUSINESS EXTENSION COLUMNS
-- ============================================================

ALTER TABLE business ADD COLUMN owner_id TEXT REFERENCES owner(id);
ALTER TABLE business ADD COLUMN onboarding_state TEXT NOT NULL DEFAULT 'registered' CHECK (onboarding_state IN ('registered','owner_first_login','setup_complete'));
ALTER TABLE business ADD COLUMN business_type TEXT;
ALTER TABLE business ADD COLUMN country TEXT NOT NULL DEFAULT 'TZ';
ALTER TABLE business ADD COLUMN address_ward TEXT;
ALTER TABLE business ADD COLUMN address_street TEXT;
ALTER TABLE business ADD COLUMN address_area TEXT;
ALTER TABLE business ADD COLUMN latitude REAL;
ALTER TABLE business ADD COLUMN longitude REAL;
ALTER TABLE business ADD COLUMN lipa_namba TEXT;
ALTER TABLE business ADD COLUMN payment_number TEXT;
ALTER TABLE business ADD COLUMN declared_branch_count INTEGER;
ALTER TABLE business ADD COLUMN terms_version TEXT;
ALTER TABLE business ADD COLUMN terms_locale TEXT;
ALTER TABLE business ADD COLUMN terms_text_sha256 TEXT;
ALTER TABLE business ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE business ADD COLUMN terms_accepted_by_user_id TEXT;
