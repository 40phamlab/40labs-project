CREATE TABLE partner_facility (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  partner_business_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pharmacy','clinic','hospital','lab','other')),
  contact_mobile TEXT,
  contact_whatsapp TEXT,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_partner_facility_workspace ON partner_facility(workspace_id, branch_id);
