-- PHASE: Admin-A
-- Migration 0002: Admin Operations & Platform Ops
--
-- DESIGN NOTE: Why admin ops tables have no workspace_id / branch_id:
-- Admin users, admin sessions, audit logs, infrastructure health checks, and platform-wide ops events
-- are system-level operational entities rather than tenant/business-specific data. They govern platform
-- oversight, security, and auditing across all workspaces and branches globally, and thus do not belong
-- to any single tenant workspace or branch.

CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret_enc TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL REFERENCES admin_users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    ip TEXT,
    user_agent TEXT,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS business_verification (
    business_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    decided_by TEXT,
    decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);

-- Immutable audit log triggers (block UPDATE and DELETE)
CREATE OR REPLACE FUNCTION block_admin_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'admin_audit_log is immutable: UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_audit_no_update ON admin_audit_log;
CREATE TRIGGER trg_admin_audit_no_update
BEFORE UPDATE ON admin_audit_log
FOR EACH ROW EXECUTE FUNCTION block_admin_audit_mutation();

DROP TRIGGER IF EXISTS trg_admin_audit_no_delete ON admin_audit_log;
CREATE TRIGGER trg_admin_audit_no_delete
BEFORE DELETE ON admin_audit_log
FOR EACH ROW EXECUTE FUNCTION block_admin_audit_mutation();

CREATE TABLE IF NOT EXISTS infra_health_checks (
    id TEXT PRIMARY KEY,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    detail TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops_events (
    id TEXT PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    business_id TEXT,
    device_id TEXT,
    meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_ops_events_ts ON ops_events(ts DESC);
