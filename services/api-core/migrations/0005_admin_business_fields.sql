-- Additive admin profile fields for installations created before the admin UI.
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS address_region TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tmda_number TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS pharmacy_council_no TEXT;
