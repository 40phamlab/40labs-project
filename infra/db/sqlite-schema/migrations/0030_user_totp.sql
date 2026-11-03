CREATE TABLE user_totp (
    user_id TEXT PRIMARY KEY REFERENCES app_user(id),
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    secret_enc BLOB NOT NULL,
    enabled_at TEXT,
    last_used_step INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
