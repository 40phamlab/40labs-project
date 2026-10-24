-- 40LabsCore — Migration 0027: Sync Fix-up (Drop tmda_license_no, price_history entity, compaction fix)

PRAGMA foreign_keys = OFF;

-- Drop outbox triggers first before dropping column
DROP TRIGGER IF EXISTS trg_business_outbox_upsert;
DROP TRIGGER IF EXISTS trg_business_outbox_update;

-- Drop tmda_license_no column from business
ALTER TABLE business DROP COLUMN tmda_license_no;

-- Drop dependent view and all outbox triggers
DROP VIEW IF EXISTS sync_outbox_compacted;
DROP TRIGGER IF EXISTS trg_inventory_item_outbox_upsert;
DROP TRIGGER IF EXISTS trg_inventory_item_outbox_update;
DROP TRIGGER IF EXISTS trg_price_outbox_upsert;
DROP TRIGGER IF EXISTS trg_price_outbox_update;
DROP TRIGGER IF EXISTS trg_daily_summary_outbox_upsert;
DROP TRIGGER IF EXISTS trg_daily_summary_outbox_update;
DROP TRIGGER IF EXISTS trg_price_history_outbox_insert;

-- Recreate sync_outbox with updated entity CHECK constraint including 'price_history'
CREATE TABLE IF NOT EXISTS sync_outbox_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  entity TEXT CHECK (entity IN ('business','inventory_item','price','price_history','daily_summary')) NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT CHECK (op IN ('upsert','delete')) NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','inflight','done','failed')) NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO sync_outbox_new (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, attempts, last_error, created_at)
SELECT id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, attempts, last_error, created_at
FROM sync_outbox;

DROP TABLE IF EXISTS sync_outbox;
ALTER TABLE sync_outbox_new RENAME TO sync_outbox;

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

-- Re-create outbox triggers for business, inventory_item, price, daily_summary, price_history

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
      'pharmacy_council_no', NEW.pharmacy_council_no,
      'role_scopes', NEW.role_scopes,
      'contact_mobile', NEW.contact_mobile,
      'contact_email', NEW.contact_email,
      'contact_whatsapp', NEW.contact_whatsapp,
      'address_region', NEW.address_region,
      'address_district', NEW.address_district,
      'address_place', NEW.address_place,
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
      'pharmacy_council_no', NEW.pharmacy_council_no,
      'role_scopes', NEW.role_scopes,
      'contact_mobile', NEW.contact_mobile,
      'contact_email', NEW.contact_email,
      'contact_whatsapp', NEW.contact_whatsapp,
      'address_region', NEW.address_region,
      'address_district', NEW.address_district,
      'address_place', NEW.address_place,
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
      'id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'medicine_id', NEW.medicine_id,
      'batch_number', NEW.batch_number, 'expiry_date', NEW.expiry_date, 'buy_price', NEW.buy_price, 'sell_price', NEW.sell_price,
      'quantity', NEW.quantity, 'low_stock_threshold', NEW.low_stock_threshold, 'cold_chain_required', NEW.cold_chain_required,
      'is_deactivated', NEW.is_deactivated, 'version', NEW.version, 'deleted_at', NEW.deleted_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at
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
      'id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'medicine_id', NEW.medicine_id,
      'batch_number', NEW.batch_number, 'expiry_date', NEW.expiry_date, 'buy_price', NEW.buy_price, 'sell_price', NEW.sell_price,
      'quantity', NEW.quantity, 'low_stock_threshold', NEW.low_stock_threshold, 'cold_chain_required', NEW.cold_chain_required,
      'is_deactivated', NEW.is_deactivated, 'version', NEW.version, 'deleted_at', NEW.deleted_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at
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
    NEW.workspace_id, NEW.branch_id, 'price', NEW.id, 'upsert',
    json_object('id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'inventory_item_id', NEW.inventory_item_id, 'selling_price', NEW.selling_price, 'cost_price', NEW.cost_price, 'version', NEW.version, 'deleted_at', NEW.deleted_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
    NEW.version, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_price_outbox_update
AFTER UPDATE ON price
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id, NEW.branch_id, 'price', NEW.id, CASE WHEN NEW.deleted_at IS NOT NULL THEN 'delete' ELSE 'upsert' END,
    json_object('id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'inventory_item_id', NEW.inventory_item_id, 'selling_price', NEW.selling_price, 'cost_price', NEW.cost_price, 'version', NEW.version, 'deleted_at', NEW.deleted_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
    NEW.version, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_outbox_upsert
AFTER INSERT ON daily_summary
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id, NEW.branch_id, 'daily_summary', NEW.id, 'upsert',
    json_object('id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'summary_date', NEW.summary_date, 'revenue_total', NEW.revenue_total, 'tx_count', NEW.tx_count, 'items_sold', NEW.items_sold, 'version', NEW.version, 'updated_at', NEW.updated_at),
    NEW.version, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_summary_outbox_update
AFTER UPDATE ON daily_summary
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id, NEW.branch_id, 'daily_summary', NEW.id, 'upsert',
    json_object('id', NEW.id, 'workspace_id', NEW.workspace_id, 'branch_id', NEW.branch_id, 'summary_date', NEW.summary_date, 'revenue_total', NEW.revenue_total, 'tx_count', NEW.tx_count, 'items_sold', NEW.items_sold, 'version', NEW.version, 'updated_at', NEW.updated_at),
    NEW.version, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_price_history_outbox_insert
AFTER INSERT ON price_history
WHEN (SELECT COALESCE(skip_triggers, 0) FROM sync_state LIMIT 1) = 0
BEGIN
  INSERT INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, created_at)
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    NEW.workspace_id,
    NEW.branch_id,
    'price_history',
    NEW.id,
    'upsert',
    json_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'branch_id', NEW.branch_id,
      'inventory_item_id', NEW.inventory_item_id,
      'selling_price', NEW.selling_price,
      'cost_price', NEW.cost_price,
      'changed_at', NEW.changed_at,
      'version', NEW.version
    ),
    NEW.version,
    'pending',
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  );
END;

PRAGMA foreign_keys = ON;
