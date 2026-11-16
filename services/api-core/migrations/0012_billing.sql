CREATE TABLE IF NOT EXISTS billing_account (
    business_id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    plan_class INTEGER NOT NULL DEFAULT 0,
    custom_amount_tzs BIGINT NULL,
    billing_status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_invoice_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS invoice (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    business_id TEXT NOT NULL REFERENCES billing_account(business_id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    plan_class INTEGER NOT NULL,
    amount_tzs BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ NULL,
    payment_method TEXT NULL,
    payment_ref TEXT NULL,
    recorded_by TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_business ON invoice(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_account_workspace ON billing_account(workspace_id);
