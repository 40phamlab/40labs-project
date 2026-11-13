-- 40LabsCloud — Postgres Migration 0001: Sync Foundation

-- 1. Business registry (shared activation and admin fields)
CREATE TABLE IF NOT EXISTS business_registry (
  business_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  phone_hash TEXT UNIQUE NOT NULL,
  terms_version TEXT NOT NULL,
  terms_locale TEXT NOT NULL,
  terms_text_sha256 TEXT NOT NULL,
  terms_accepted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT,
  address_region TEXT,
  tier TEXT DEFAULT 'free',
  updated_at TIMESTAMPTZ,
  tmda_number TEXT,
  pharmacy_council_no TEXT
);

ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS address_region TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS tmda_number TEXT;
ALTER TABLE business_registry ADD COLUMN IF NOT EXISTS pharmacy_council_no TEXT;

-- 2. Cloud Inventory Items
CREATE TABLE IF NOT EXISTS cloud_inventory_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  medicine_id TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  buy_price BIGINT NOT NULL,
  sell_price BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  cold_chain_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_deactivated BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_device_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_inventory_workspace_entity ON cloud_inventory_items(workspace_id, id);

-- 3. Cloud Prices
CREATE TABLE IF NOT EXISTS cloud_prices (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL,
  selling_price BIGINT NOT NULL,
  cost_price BIGINT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_device_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_prices_workspace_entity ON cloud_prices(workspace_id, id);

-- 4. Cloud Price History
CREATE TABLE IF NOT EXISTS cloud_price_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL,
  selling_price BIGINT NOT NULL,
  cost_price BIGINT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_device_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_price_history_workspace_entity ON cloud_price_history(workspace_id, inventory_item_id);

-- 5. Cloud Daily Summaries
CREATE TABLE IF NOT EXISTS cloud_daily_summaries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  summary_date DATE NOT NULL,
  revenue_total BIGINT NOT NULL DEFAULT 0,
  tx_count INTEGER NOT NULL DEFAULT 0,
  items_sold INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_device_id TEXT NOT NULL,
  UNIQUE(workspace_id, branch_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_cloud_daily_summaries_workspace_date ON cloud_daily_summaries(workspace_id, summary_date);

-- 6. Sync Changes & Devices log
CREATE TABLE IF NOT EXISTS sync_changes (
  change_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  entity TEXT CHECK (entity IN ('business','inventory_item','price','price_history','daily_summary')) NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_changes_workspace_entity ON sync_changes(workspace_id, entity_id);

CREATE TABLE IF NOT EXISTS sync_devices (
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_count INTEGER NOT NULL DEFAULT 0,
  app_version TEXT
);
