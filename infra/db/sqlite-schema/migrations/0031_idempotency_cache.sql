CREATE TABLE IF NOT EXISTS idempotency_cache (
    workspace_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    route TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, idempotency_key)
);
