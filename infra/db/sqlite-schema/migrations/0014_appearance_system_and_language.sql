PRAGMA foreign_keys=OFF;

CREATE TABLE business_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tin TEXT,
  tmda_number TEXT,
  role_scopes TEXT NOT NULL DEFAULT '["pharmacy"]',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','class_1','class_2','class_3','class_4_enterprise')),
  contact_mobile TEXT NOT NULL,
  contact_email TEXT,
  contact_whatsapp TEXT,
  address_region TEXT,
  address_district TEXT,
  address_place TEXT,
  logo_url TEXT,
  appearance_mode TEXT NOT NULL DEFAULT 'light' CHECK (appearance_mode IN ('light','dark','system')),
  owner_id TEXT REFERENCES owner(id),
  onboarding_state TEXT NOT NULL DEFAULT 'registered' CHECK (onboarding_state IN ('registered','owner_first_login','setup_complete')),
  business_type TEXT,
  country TEXT NOT NULL DEFAULT 'TZ',
  address_ward TEXT,
  address_street TEXT,
  address_area TEXT,
  latitude REAL,
  longitude REAL,
  lipa_namba TEXT,
  payment_number TEXT,
  declared_branch_count INTEGER,
  terms_version TEXT,
  terms_locale TEXT,
  terms_text_sha256 TEXT,
  terms_accepted_at TEXT,
  terms_accepted_by_user_id TEXT,
  scale TEXT,
  idle_lock_minutes INTEGER NOT NULL DEFAULT 5 CHECK (idle_lock_minutes BETWEEN 1 AND 30),
  language TEXT NOT NULL DEFAULT 'sw-TZ',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO business_new (
  id, workspace_id, branch_id, business_id, name, tin, tmda_number,
  role_scopes, tier, contact_mobile, contact_email, contact_whatsapp,
  address_region, address_district, address_place, logo_url, appearance_mode,
  owner_id, onboarding_state, business_type, country, address_ward, address_street,
  address_area, latitude, longitude, lipa_namba, payment_number, declared_branch_count,
  terms_version, terms_locale, terms_text_sha256, terms_accepted_at, terms_accepted_by_user_id,
  scale, idle_lock_minutes, language, created_at, updated_at
)
SELECT
  id, workspace_id, branch_id, business_id, name, tin, tmda_number,
  role_scopes, tier, contact_mobile, contact_email, contact_whatsapp,
  address_region, address_district, address_place, logo_url,
  CASE WHEN appearance_mode IN ('light', 'dark', 'system') THEN appearance_mode ELSE 'light' END,
  owner_id, onboarding_state, business_type, country, address_ward, address_street,
  address_area, latitude, longitude, lipa_namba, payment_number, declared_branch_count,
  terms_version, terms_locale, terms_text_sha256, terms_accepted_at, terms_accepted_by_user_id,
  scale, idle_lock_minutes, 'sw-TZ', created_at, updated_at
FROM business;

DROP TABLE business;
ALTER TABLE business_new RENAME TO business;

CREATE UNIQUE INDEX idx_business_business_id ON business(business_id);

PRAGMA foreign_keys=ON;
