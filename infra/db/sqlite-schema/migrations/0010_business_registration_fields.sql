-- Persist all optional registration details consumed by the desktop app.
-- Existing databases receive these fields through SQLx's ordered migration runner.
ALTER TABLE business ADD COLUMN owner_id TEXT;
ALTER TABLE business ADD COLUMN onboarding_state TEXT NOT NULL DEFAULT 'registered';
ALTER TABLE business ADD COLUMN business_type TEXT;
ALTER TABLE business ADD COLUMN country TEXT NOT NULL DEFAULT 'TZ';
ALTER TABLE business ADD COLUMN address_ward TEXT;
ALTER TABLE business ADD COLUMN address_street TEXT;
ALTER TABLE business ADD COLUMN address_area TEXT;
ALTER TABLE business ADD COLUMN latitude REAL;
ALTER TABLE business ADD COLUMN longitude REAL;
ALTER TABLE business ADD COLUMN lipa_namba TEXT;
ALTER TABLE business ADD COLUMN payment_number TEXT;
ALTER TABLE business ADD COLUMN declared_branch_count INTEGER;
ALTER TABLE business ADD COLUMN terms_version TEXT;
ALTER TABLE business ADD COLUMN terms_locale TEXT;
ALTER TABLE business ADD COLUMN terms_text_sha256 TEXT;
ALTER TABLE business ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE business ADD COLUMN terms_accepted_by_user_id TEXT;
ALTER TABLE business ADD COLUMN scale TEXT;
ALTER TABLE business ADD COLUMN idle_lock_minutes INTEGER NOT NULL DEFAULT 5;
