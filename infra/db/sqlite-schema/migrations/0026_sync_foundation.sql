-- 40LabsCore — Migration 0026: Sync Foundation (Desktop -> Cloud, One-Way Push)

PRAGMA foreign_keys = ON;

-- 1. Add version and deleted_at to synced tables if absent
ALTER TABLE business ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE business ADD COLUMN deleted_at TEXT;
ALTER TABLE business ADD COLUMN tmda_license_no TEXT;
ALTER TABLE business ADD COLUMN pharmacy_council_no TEXT;

ALTER TABLE inventory_item ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE inventory_item ADD COLUMN deleted_at TEXT;

-- 2. Price table (synced entity 'price')
CREATE TABLE IF NOT EXISTS price (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
  selling_price INTEGER NOT NULL,
  cost_price INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_price_inventory ON price(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_price_workspace ON price(workspace_id, branch_id);

INSERT OR IGNORE INTO price (id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price, version, created_at, updated_at)
SELECT id, workspace_id, branch_id, id, sell_price, buy_price, 1, created_at, updated_at FROM inventory_item;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_insert_price
AFTER INSERT ON inventory_item
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT OR IGNORE INTO price (id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price, version, created_at, updated_at)
  VALUES (NEW.id, NEW.workspace_id, NEW.branch_id, NEW.id, NEW.sell_price, NEW.buy_price, NEW.version, NEW.created_at, NEW.updated_at);
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_sync_price
AFTER UPDATE OF sell_price, buy_price, branch_id, workspace_id ON inventory_item
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND (OLD.sell_price <> NEW.sell_price OR OLD.buy_price <> NEW.buy_price OR OLD.branch_id <> NEW.branch_id OR OLD.workspace_id <> NEW.workspace_id)
BEGIN
  UPDATE price
  SET selling_price = NEW.sell_price,
      cost_price = NEW.buy_price,
      branch_id = NEW.branch_id,
      workspace_id = NEW.workspace_id,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE inventory_item_id = NEW.id;

  INSERT OR IGNORE INTO price (id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price, version, created_at, updated_at)
  VALUES (NEW.id, NEW.workspace_id, NEW.branch_id, NEW.id, NEW.sell_price, NEW.buy_price, 1, NEW.created_at, NEW.updated_at);
END;

-- 3. Price History table (append-only)
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
  selling_price INTEGER NOT NULL,
  cost_price INTEGER NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(inventory_item_id);

CREATE TRIGGER IF NOT EXISTS trg_price_history_no_update
BEFORE UPDATE ON price_history
BEGIN
  SELECT RAISE(ABORT, 'price_history is append-only: UPDATE is not permitted');
END;

CREATE TRIGGER IF NOT EXISTS trg_price_history_no_delete
BEFORE DELETE ON price_history
BEGIN
  SELECT RAISE(ABORT, 'price_history is append-only: DELETE is not permitted');
END;

CREATE TRIGGER IF NOT EXISTS trg_price_change_history
AFTER UPDATE ON price
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND (OLD.selling_price <> NEW.selling_price OR OLD.cost_price <> NEW.cost_price)
BEGIN
  INSERT INTO price_history (id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price, changed_at, version)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    NEW.inventory_item_id,
    NEW.selling_price,
    NEW.cost_price,
    strftime('%Y-%m-%dT%H:%M:%fZ','now'),
    NEW.version
  );
END;

-- 4. Daily Summary table
CREATE TABLE IF NOT EXISTS daily_summary (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  summary_date TEXT NOT NULL,
  revenue_total INTEGER NOT NULL DEFAULT 0,
  tx_count INTEGER NOT NULL DEFAULT 0,
  items_sold INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(workspace_id, branch_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(summary_date);

CREATE TRIGGER IF NOT EXISTS trg_sale_daily_summary_insert
AFTER INSERT ON sale
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO daily_summary (id, workspace_id, branch_id, summary_date, revenue_total, tx_count, items_sold, version, updated_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    date(NEW.created_at),
    NEW.grand_total,
    1,
    (SELECT COALESCE(SUM(quantity), 0) FROM sale_line WHERE sale_id = NEW.id),
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  )
  ON CONFLICT(workspace_id, branch_id, summary_date) DO UPDATE SET
    revenue_total = revenue_total + NEW.grand_total,
    tx_count = tx_count + 1,
    items_sold = items_sold + (SELECT COALESCE(SUM(quantity), 0) FROM sale_line WHERE sale_id = NEW.id),
    version = version + 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;

-- 5. Sync State & Sync Outbox tables
CREATE TABLE IF NOT EXISTS sync_state (
  device_id TEXT PRIMARY KEY,
  bootstrap_done INTEGER DEFAULT 0,
  last_ack_at TEXT,
  last_server_cursor TEXT,
  skip_triggers INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO sync_state (device_id, bootstrap_done, skip_triggers)
VALUES ('local-device', 0, 0);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  entity TEXT CHECK (entity IN ('business','inventory_item','price','daily_summary')) NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT CHECK (op IN ('upsert','delete')) NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','inflight','done','failed')) NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_created ON sync_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity, entity_id);

CREATE VIEW IF NOT EXISTS sync_outbox_compacted AS
SELECT o.*
FROM sync_outbox o
JOIN (
    SELECT entity, entity_id, MAX(rowid) as max_rowid
    FROM sync_outbox
    WHERE status = 'pending'
    GROUP BY entity, entity_id
) latest ON o.entity = latest.entity AND o.entity_id = latest.entity_id AND o.rowid = latest.max_rowid
WHERE o.status = 'pending';

-- 6. Version bump triggers
CREATE TRIGGER IF NOT EXISTS trg_business_version_bump
AFTER UPDATE ON business
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND NEW.version = OLD.version
BEGIN
  UPDATE business SET version = OLD.version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_version_bump
AFTER UPDATE ON inventory_item
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND NEW.version = OLD.version
BEGIN
  UPDATE inventory_item SET version = OLD.version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_price_version_bump
AFTER UPDATE ON price
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND NEW.version = OLD.version
BEGIN
  UPDATE price SET version = OLD.version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_version_bump
AFTER UPDATE ON daily_summary
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
  AND NEW.version = OLD.version
BEGIN
  UPDATE daily_summary SET version = OLD.version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

-- 7. Block hard DELETE on synced tables
CREATE TRIGGER IF NOT EXISTS trg_business_no_hard_delete
BEFORE DELETE ON business
BEGIN
  SELECT RAISE(ABORT, 'Hard delete on synced table business is blocked; use soft delete (deleted_at)');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_no_hard_delete
BEFORE DELETE ON inventory_item
BEGIN
  SELECT RAISE(ABORT, 'Hard delete on synced table inventory_item is blocked; use soft delete (deleted_at)');
END;

CREATE TRIGGER IF NOT EXISTS trg_price_no_hard_delete
BEFORE DELETE ON price
BEGIN
  SELECT RAISE(ABORT, 'Hard delete on synced table price is blocked; use soft delete (deleted_at)');
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_no_hard_delete
BEFORE DELETE ON daily_summary
BEGIN
  SELECT RAISE(ABORT, 'Hard delete on synced table daily_summary is blocked; use soft delete (deleted_at)');
END;

-- 8. Sync Outbox triggers
CREATE TRIGGER IF NOT EXISTS trg_business_outbox_upsert
AFTER INSERT ON business
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'business',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'business_id', NEW.business_id,
      'name', NEW.name,
      'tin', NEW.tin,
      'tmda_number', NEW.tmda_number,
      'tmda_license_no', NEW.tmda_license_no,
      'pharmacy_council_no', NEW.pharmacy_council_no,
      'role_scopes', NEW.role_scopes,
      'tier', NEW.tier,
      'contact_mobile', NEW.contact_mobile,
      'contact_email', NEW.contact_email,
      'contact_whatsapp', NEW.contact_whatsapp,
      'address_region', NEW.address_region,
      'address_district', NEW.address_district,
      'address_place', NEW.address_place,
      'logo_url', NEW.logo_url,
      'appearance_mode', NEW.appearance_mode,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_business_outbox_update
AFTER UPDATE ON business
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'business',
    NEW.id,
    CASE WHEN NEW.deleted_at IS NOT NULL THEN 'delete' ELSE 'upsert' END,
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'business_id', NEW.business_id,
      'name', NEW.name,
      'tin', NEW.tin,
      'tmda_number', NEW.tmda_number,
      'tmda_license_no', NEW.tmda_license_no,
      'pharmacy_council_no', NEW.pharmacy_council_no,
      'role_scopes', NEW.role_scopes,
      'tier', NEW.tier,
      'contact_mobile', NEW.contact_mobile,
      'contact_email', NEW.contact_email,
      'contact_whatsapp', NEW.contact_whatsapp,
      'address_region', NEW.address_region,
      'address_district', NEW.address_district,
      'address_place', NEW.address_place,
      'logo_url', NEW.logo_url,
      'appearance_mode', NEW.appearance_mode,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_outbox_upsert
AFTER INSERT ON inventory_item
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'inventory_item',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'medicine_id', NEW.medicine_id,
      'batch_number', NEW.batch_number,
      'expiry_date', NEW.expiry_date,
      'buy_price', NEW.buy_price,
      'sell_price', NEW.sell_price,
      'quantity', NEW.quantity,
      'low_stock_threshold', NEW.low_stock_threshold,
      'cold_chain_required', NEW.cold_chain_required,
      'is_deactivated', NEW.is_deactivated,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_item_outbox_update
AFTER UPDATE ON inventory_item
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'inventory_item',
    NEW.id,
    CASE WHEN NEW.deleted_at IS NOT NULL THEN 'delete' ELSE 'upsert' END,
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'medicine_id', NEW.medicine_id,
      'batch_number', NEW.batch_number,
      'expiry_date', NEW.expiry_date,
      'buy_price', NEW.buy_price,
      'sell_price', NEW.sell_price,
      'quantity', NEW.quantity,
      'low_stock_threshold', NEW.low_stock_threshold,
      'cold_chain_required', NEW.cold_chain_required,
      'is_deactivated', NEW.is_deactivated,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_price_outbox_upsert
AFTER INSERT ON price
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'price',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'inventory_item_id', NEW.inventory_item_id,
      'selling_price', NEW.selling_price,
      'cost_price', NEW.cost_price,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_price_outbox_update
AFTER UPDATE ON price
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'price',
    NEW.id,
    CASE WHEN NEW.deleted_at IS NOT NULL THEN 'delete' ELSE 'upsert' END,
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'inventory_item_id', NEW.inventory_item_id,
      'selling_price', NEW.selling_price,
      'cost_price', NEW.cost_price,
      'version', NEW.version,
      'deleted_at', NEW.deleted_at,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_outbox_upsert
AFTER INSERT ON daily_summary
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'daily_summary',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'summary_date', NEW.summary_date,
      'revenue_total', NEW.revenue_total,
      'tx_count', NEW.tx_count,
      'items_sold', NEW.items_sold,
      'version', NEW.version,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_outbox_update
AFTER UPDATE ON daily_summary
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'daily_summary',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'summary_date', NEW.summary_date,
      'revenue_total', NEW.revenue_total,
      'tx_count', NEW.tx_count,
      'items_sold', NEW.items_sold,
      'version', NEW.version,
      'updated_at', NEW.updated_at
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;
