-- Versioned device credential enrollment and sync isolation metadata.
-- Additive and data-preserving: existing telemetry/change history is retained.
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS role_scopes TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS contact_mobile TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS address_district TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS address_place TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS labs_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tmda_registered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE cloud_inventory_items ALTER COLUMN version TYPE BIGINT USING version::BIGINT;
ALTER TABLE cloud_prices ALTER COLUMN version TYPE BIGINT USING version::BIGINT;
ALTER TABLE cloud_price_history ALTER COLUMN version TYPE BIGINT USING version::BIGINT;
ALTER TABLE cloud_daily_summaries ALTER COLUMN version TYPE BIGINT USING version::BIGINT;

CREATE TABLE IF NOT EXISTS device_enrollments (
    device_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    refresh_expires_at TIMESTAMPTZ NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 1 CHECK (token_version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_enrollments_scope
    ON device_enrollments(workspace_id, business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_device_enrollments_active
    ON device_enrollments(device_id) WHERE revoked_at IS NULL;

ALTER TABLE sync_devices ADD COLUMN IF NOT EXISTS business_id TEXT;
UPDATE sync_devices d
SET business_id = b.business_id,
    branch_id = CASE WHEN d.branch_id = '' THEN b.branch_id ELSE d.branch_id END
FROM business_registry b
WHERE d.workspace_id = b.workspace_id AND d.business_id IS NULL
  AND ((d.branch_id <> '' AND d.branch_id = b.branch_id)
       OR (d.branch_id = '' AND (SELECT COUNT(*) FROM business_registry x WHERE x.workspace_id = d.workspace_id) = 1));
-- If multiple branches have previously shared a workspace row, leave legacy
-- ambiguous telemetry unbound rather than assigning it to an arbitrary branch.

ALTER TABLE sync_changes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('processing', 'applied', 'stale', 'rejected'));
ALTER TABLE sync_changes ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE sync_changes ADD COLUMN IF NOT EXISTS payload_sha256 TEXT;
UPDATE sync_changes c
SET branch_id = b.branch_id
FROM business_registry b
WHERE c.workspace_id = b.workspace_id AND c.branch_id = ''
  AND (SELECT COUNT(*) FROM business_registry x WHERE x.workspace_id = c.workspace_id) = 1;

-- New changes are scoped to a device; preserve every historical row while
-- allowing independent devices to use the same client-generated change id.
ALTER TABLE sync_changes DROP CONSTRAINT IF EXISTS sync_changes_pkey;
ALTER TABLE sync_changes ADD CONSTRAINT sync_changes_pkey PRIMARY KEY (device_id, change_id);
CREATE INDEX IF NOT EXISTS idx_sync_changes_tenant_branch_received
    ON sync_changes(workspace_id, branch_id, received_at DESC);


CREATE TABLE IF NOT EXISTS device_enrollment_grants (
    grant_sha256 TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
