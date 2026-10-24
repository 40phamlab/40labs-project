-- Migration 0002: Business Verification & Audit Log

ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('unverified','pending_review','verified','rejected','info_requested')) DEFAULT 'unverified';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS labs_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tmda_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS verification_audit (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES business_registry(business_id),
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_business ON verification_audit(business_id);

-- Immutable audit log triggers (block UPDATE and DELETE)
CREATE OR REPLACE FUNCTION block_verification_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'verification_audit is immutable: UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verification_audit_no_update ON verification_audit;
CREATE TRIGGER trg_verification_audit_no_update
BEFORE UPDATE ON verification_audit
FOR EACH ROW EXECUTE FUNCTION block_verification_audit_mutation();

DROP TRIGGER IF EXISTS trg_verification_audit_no_delete ON verification_audit;
CREATE TRIGGER trg_verification_audit_no_delete
BEFORE DELETE ON verification_audit
FOR EACH ROW EXECUTE FUNCTION block_verification_audit_mutation();
