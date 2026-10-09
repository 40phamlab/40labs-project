CREATE TABLE IF NOT EXISTS otp_challenge (
    phone_hash TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_token (
    token_hash TEXT PRIMARY KEY,
    phone_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_registry (
    business_id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    phone_hash TEXT UNIQUE NOT NULL,
    terms_version TEXT NOT NULL,
    terms_locale TEXT NOT NULL,
    terms_text_sha256 TEXT NOT NULL,
    terms_accepted_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);
