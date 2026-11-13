-- Durable administrative authentication state and TOTP replay prevention.
-- Additive only: existing users and sessions remain valid.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_last_step BIGINT;

CREATE TABLE IF NOT EXISTS admin_login_challenges (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL REFERENCES admin_users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_challenges_expiry
    ON admin_login_challenges(expires_at) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS api_rate_limit_buckets (
    key_hash TEXT PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL,
    hit_count BIGINT NOT NULL CHECK (hit_count > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_updated ON api_rate_limit_buckets(updated_at);

CREATE TABLE IF NOT EXISTS admin_recovery_codes (
    admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    PRIMARY KEY (admin_user_id, code_hash)
);
