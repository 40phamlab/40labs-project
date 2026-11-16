ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS scale TEXT DEFAULT 'medium';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'personal';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS address_ward TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS lipa_namba TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS payment_number TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
