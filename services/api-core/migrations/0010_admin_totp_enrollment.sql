ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enrolled_at TIMESTAMPTZ;

-- Existing encrypted secrets were provisioned as active enrollment by the
-- earlier release. New first-login secrets remain unconfirmed until a valid
-- challenge response sets this timestamp.
UPDATE admin_users
SET totp_enrolled_at = created_at
WHERE totp_secret_enc IS NOT NULL AND totp_enrolled_at IS NULL;
