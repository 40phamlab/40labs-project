-- Enforce one successful sale per workspace idempotency key.
-- The partial index preserves legacy sales with no idempotency key. If old
-- duplicates exist, migration fails transactionally so they can be reconciled
-- without deleting or silently choosing a winner.
CREATE UNIQUE INDEX idx_sale_workspace_idempotency
    ON sale(workspace_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
